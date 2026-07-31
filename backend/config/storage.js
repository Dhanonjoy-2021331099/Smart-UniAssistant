import axios from 'axios';

const STORAGE_URL = 'https://integrations.emergentagent.com/objstore/api/v1/storage';
const EMERGENT_KEY = process.env.EMERGENT_LLM_KEY;
const APP_NAME = process.env.APP_NAME || 'smart-uniassistant';

let storageKey = null;

export const initStorage = async () => {
  if (storageKey) return storageKey;
  
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
    console.error('❌ Storage initialization failed:', error.message);
    throw error;
  }
};

export const uploadFile = async (path, data, contentType) => {
  const key = await initStorage();
  
  try {
    const response = await axios.put(
      `${STORAGE_URL}/objects/${path}`,
      data,
      {
        headers: {
          'X-Storage-Key': key,
          'Content-Type': contentType
        },
        timeout: 120000
      }
    );
    
    return response.data;
  } catch (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }
};

export const downloadFile = async (path) => {
  const key = await initStorage();
  
  try {
    const response = await axios.get(
      `${STORAGE_URL}/objects/${path}`,
      {
        headers: { 'X-Storage-Key': key },
        responseType: 'arraybuffer',
        timeout: 60000
      }
    );
    
    return {
      data: response.data,
      contentType: response.headers['content-type'] || 'application/octet-stream'
    };
  } catch (error) {
    throw new Error(`Download failed: ${error.message}`);
  }
};

export const generateFilePath = (userId, filename) => {
  const ext = filename.split('.').pop();
  const timestamp = Date.now();
  return `${APP_NAME}/uploads/${userId}/${timestamp}-${filename}`;
};