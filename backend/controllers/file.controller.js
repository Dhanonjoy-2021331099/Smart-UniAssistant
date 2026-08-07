import { downloadFile, withAttachmentFlag } from "../config/storage.js";
import File from "../models/File.js";

export const downloadFileById = async (req, res) => {
  try {
    const { fileId } = req.params;

    const fileRecord = await File.findById(fileId);
    if (!fileRecord || fileRecord.isDeleted) {
      return res.status(404).json({ error: "File not found" });
    }

    const { url, data, contentType } = await downloadFile(
      fileRecord.storagePath,
    );

    if (url) {
      return res.redirect(withAttachmentFlag(url));
    }

    res.set("Content-Type", fileRecord.contentType || contentType);
    res.set(
      "Content-Disposition",
      `attachment; filename="${fileRecord.originalFileName}"`,
    );
    res.send(Buffer.from(data));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const downloadFileByPath = async (req, res) => {
  try {
    const filePath = req.params[0];

    const fileRecord = await File.findOne({
      storagePath: filePath,
      isDeleted: false,
    });
    if (!fileRecord) {
      return res.status(404).json({ error: "File not found" });
    }

    const { url, data, contentType } = await downloadFile(filePath);

    if (url) {
      return res.redirect(url);
    }

    res.set("Content-Type", fileRecord.contentType || contentType);
    res.set(
      "Content-Disposition",
      `inline; filename="${fileRecord.originalFileName}"`,
    );
    res.send(Buffer.from(data));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default { downloadFileById, downloadFileByPath };
