import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import AppError from '../utils/AppError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const LOCAL_UPLOAD_DIR = path.resolve(__dirname, '..', 'uploads');

const STORAGE_URL =
  process.env.STORAGE_URL ||
  'https://integrations.emergentagent.com/objstore/api/v1/storage';
const EMERGENT_KEY = process.env.EMERGENT_LLM_KEY;
const APP_NAME = process.env.APP_NAME || 'smart-uniassistant';

export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
export const ALLOWED_ATTACHMENT_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]);
export const ALLOWED_ATTACHMENT_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.pdf',
]);

const MIME_BY_EXT = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.pdf': 'application/pdf',
};

let storageKey = null;
let useLocal = false;

const hasValidEmergentKey = () =>
  Boolean(
    EMERGENT_KEY &&
      !EMERGENT_KEY.includes('xxxxx') &&
      EMERGENT_KEY.startsWith('sk-'),
  );

const ensureLocalDir = async () => {
  await fs.mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
};

export const validateAttachmentFile = (file) => {
  if (!file) {
    return;
  }

  const ext = path.extname(file.originalname || '').toLowerCase();

  if (
    !ALLOWED_ATTACHMENT_MIMES.has(file.mimetype) &&
    !ALLOWED_ATTACHMENT_EXTENSIONS.has(ext)
  ) {
    throw new AppError(
      `Unsupported file type for "${file.originalname}". Allowed types: JPG, PNG, WEBP, GIF, PDF.`,
      400,
    );
  }

  if (file.size > MAX_ATTACHMENT_SIZE) {
    throw new AppError(
      `File "${file.originalname}" exceeds the 10MB size limit.`,
      400,
    );
  }
};

export const initStorage = async () => {
  if (storageKey) return storageKey;

  if (useLocal) {
    await ensureLocalDir();
    return null;
  }

  if (!hasValidEmergentKey()) {
    useLocal = true;
    await ensureLocalDir();
    console.warn(
      '⚠️ No valid EMERGENT_LLM_KEY configured. Using local file storage.',
    );
    return null;
  }

  try {
    const response = await axios.post(
      `${STORAGE_URL}/init`,
      { emergent_key: EMERGENT_KEY },
      { timeout: 30000 }
    );

    storageKey = response.data.storage_key;
    console.log('✅ Object Storage initialized');
    return storageKey;
  } catch (error) {
    useLocal = true;
    await ensureLocalDir();
    console.warn(
      '⚠️ Object storage unavailable, falling back to local file storage:',
      error.message,
    );
    return null;
  }
};

const uploadToLocal = async (relativePath, data) => {
  const absolutePath = path.join(LOCAL_UPLOAD_DIR, relativePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, data);
  return { url: `/uploads/${relativePath.replace(/\\/g, '/')}` };
};

export const uploadFile = async (relativePath, data, contentType) => {
  const key = await initStorage();

  if (!key) {
    return uploadToLocal(relativePath, data);
  }

  try {
    const response = await axios.put(
      `${STORAGE_URL}/objects/${relativePath}`,
      data,
      {
        headers: {
          'X-Storage-Key': key,
          'Content-Type': contentType,
        },
        timeout: 120000,
      }
    );

    return response.data;
  } catch (error) {
    console.warn(
      '⚠️ Object storage upload failed, falling back to local file storage:',
      error.message,
    );
    return uploadToLocal(relativePath, data);
  }
};

export const downloadFile = async (relativePath) => {
  const key = await initStorage();

  if (!key) {
    try {
      const absolutePath = path.join(LOCAL_UPLOAD_DIR, relativePath);
      const data = await fs.readFile(absolutePath);
      const ext = path.extname(relativePath).toLowerCase();
      const contentType =
        MIME_BY_EXT[ext] || 'application/octet-stream';

      return { data, contentType };
    } catch (error) {
      throw new Error(`Download failed: ${error.message}`);
    }
  }

  try {
    const response = await axios.get(
      `${STORAGE_URL}/objects/${relativePath}`,
      {
        headers: { 'X-Storage-Key': key },
        responseType: 'arraybuffer',
        timeout: 60000,
      }
    );

    return {
      data: response.data,
      contentType: response.headers['content-type'] || 'application/octet-stream',
    };
  } catch (error) {
    throw new Error(`Download failed: ${error.message}`);
  }
};

export const generateFilePath = (userId, filename) => {
  const ext = path.extname(filename);
  const timestamp = Date.now();
  const uniqueName = `${timestamp}-${filename}`;
  return `${APP_NAME}/uploads/${userId}/${uniqueName}`;
};

const deleteFromLocal = async (relativePath) => {
  const absolutePath = path.join(LOCAL_UPLOAD_DIR, relativePath);
  await fs.unlink(absolutePath);
};

export const deleteFile = async (relativePath) => {
  if (!relativePath) {
    return;
  }

  const key = await initStorage();

  if (!key) {
    try {
      await deleteFromLocal(relativePath);
    } catch (error) {
      console.warn(
        '⚠️ Could not delete local file (may already be missing):',
        error.message,
      );
    }
    return;
  }

  try {
    await axios.delete(`${STORAGE_URL}/objects/${relativePath}`, {
      headers: { 'X-Storage-Key': key },
      timeout: 30000,
    });
  } catch (error) {
    console.warn(
      '⚠️ Object storage delete failed (file may not exist remotely):',
      error.message,
    );
  }
};

export const getUploadUrl = (uploaded, relativePath) =>
  uploaded?.url || uploaded?.public_url || uploaded?.path || `/uploads/${relativePath.replace(/\\/g, '/')}`;
