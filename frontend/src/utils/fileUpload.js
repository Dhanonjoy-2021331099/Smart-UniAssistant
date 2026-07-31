export const ALLOWED_ATTACHMENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
];

export const ALLOWED_ATTACHMENT_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".pdf",
];

export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;

export const MAX_ATTACHMENT_COUNT = 10;

export const isImageFile = (file) =>
  Boolean(file?.type) && file.type.startsWith("image/");

export const formatFileSize = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );

  const value = bytes / 1024 ** index;

  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
};

export const getFileExtension = (fileName) => {
  const lastDot = (fileName || "").lastIndexOf(".");
  return lastDot === -1 ? "" : fileName.slice(lastDot).toLowerCase();
};

export const validateAttachmentFile = (file) => {
  const extension = getFileExtension(file?.name);

  if (
    !ALLOWED_ATTACHMENT_TYPES.includes(file?.type) &&
    !ALLOWED_ATTACHMENT_EXTENSIONS.includes(extension)
  ) {
    return `"${file?.name}" is not supported. Allowed: JPG, PNG, WEBP, GIF, PDF.`;
  }

  if (file?.size > MAX_ATTACHMENT_SIZE) {
    return `"${file?.name}" exceeds the 10MB size limit.`;
  }

  return null;
};

const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to read image"));
    };
    image.src = url;
  });

const canvasToFile = (canvas, file, type, quality) =>
  new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve(file);
          return;
        }

        resolve(new File([blob], file.name, { type: blob.type }));
      },
      type,
      quality,
    );
  });

export const compressImage = async (file, maxWidth = 1600, quality = 0.8) => {
  if (!isImageFile(file) || file.type === "image/gif") {
    return file;
  }

  try {
    const image = await loadImage(file);
    const scale = Math.min(1, maxWidth / image.width);
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    if (scale >= 1 && file.size <= 1024 * 1024) {
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0, width, height);

    return canvasToFile(canvas, file, file.type, quality);
  } catch {
    return file;
  }
};

export const prepareAttachmentFiles = async (files, onProgress) => {
  const prepared = [];

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const compressed = isImageFile(file)
      ? await compressImage(file)
      : file;

    prepared.push(compressed);

    if (onProgress) {
      onProgress(Math.round(((index + 1) / files.length) * 100));
    }
  }

  return prepared;
};
