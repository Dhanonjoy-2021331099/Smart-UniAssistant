import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import cloudinary from "./cloudinary.js";
import AppError from "../utils/AppError.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const LOCAL_UPLOAD_DIR = path.resolve(__dirname, "..", "uploads");

const APP_NAME = process.env.APP_NAME || "smart-uniassistant";

export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
export const ALLOWED_ATTACHMENT_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);
export const ALLOWED_ATTACHMENT_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".pdf",
]);

const hasValidCloudinaryConfig = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );

export const validateAttachmentFile = (file) => {
  if (!file) {
    return;
  }

  const ext = path.extname(file.originalname || "").toLowerCase();

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
  if (!hasValidCloudinaryConfig()) {
    throw new AppError(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.",
      500,
    );
  }

  return true;
};

const uploadToCloudinary = (publicId, data) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        resource_type: "auto",
        overwrite: true,
        use_filename: false,
        unique_filename: false,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve({
          url: result.secure_url,
          path: result.public_id,
          size: result.bytes,
        });
      },
    );

    stream.end(data);
  });

export const uploadFile = async (relativePath, data, contentType) => {
  await initStorage();

  const publicId = relativePath.replace(/\\/g, "/");
  return uploadToCloudinary(publicId, data);
};

export const downloadFile = async (relativePath) => {
  await initStorage();

  const normalized = relativePath.replace(/\\/g, "/");

  if (/^https?:\/\//i.test(normalized)) {
    return { url: normalized };
  }

  const url = await resolveAssetUrl(normalized);

  if (!url) {
    throw new AppError("File not found in storage", 404);
  }

  return { url };
};

const resolveAssetUrl = async (publicId) => {
  for (const resourceType of ["image", "raw"]) {
    try {
      const resource = await cloudinary.api.resource(publicId, {
        resource_type: resourceType,
      });

      return resource.secure_url;
    } catch (error) {
      const code = error?.http_code ?? error?.error?.http_code ?? error?.status;

      if (code !== 404) {
        throw error;
      }
    }
  }

  return null;
};

export const withAttachmentFlag = (url) => {
  if (!url || url.includes("/fl_attachment/")) {
    return url;
  }

  return url.replace("/upload/", "/upload/fl_attachment/");
};

export const generateFilePath = (userId, filename) => {
  const ext = path.extname(filename);
  const timestamp = Date.now();
  const uniqueName = `${timestamp}-${filename}`;
  return `${APP_NAME}/uploads/${userId}/${uniqueName}`;
};

export const deleteFile = async (relativePath) => {
  if (!relativePath) {
    return;
  }

  await initStorage();

  const normalized = relativePath.replace(/\\/g, "/");

  if (/^https?:\/\//i.test(normalized)) {
    return;
  }

  try {
    await cloudinary.uploader.destroy(normalized);
  } catch (error) {
    console.warn(
      "⚠️ Cloudinary delete failed (resource may already be missing):",
      error.message,
    );
  }
};

export const getUploadUrl = (uploaded, relativePath) =>
  uploaded?.url ||
  uploaded?.public_url ||
  uploaded?.path ||
  `/uploads/${relativePath.replace(/\\/g, "/")}`;

// Legacy local-fallback cleanup retained for dev environments only.
export const ensureLocalDir = async () => {
  await fs.mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
};
