import Notice from "../models/Notice.js";
import AppError from "../utils/AppError.js";
import { uploadFile, generateFilePath } from "../config/storage.js";
import { mapMongooseError } from "../utils/validators.js";

const PRIORITIES = ["Low", "Normal", "High"];

export const canModifyNotice = (user, notice) => {
  if (!user || !notice) {
    return false;
  }

  if (user.role === "super_admin") {
    return true;
  }

  if (user.role === "cr_admin") {
    return notice.createdBy.toString() === user._id.toString();
  }

  return false;
};

const parseBoolean = (value, defaultValue = false) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }

  return defaultValue;
};

export const validateNoticeInput = (body) => {
  const title = body.title?.trim();
  const description = body.description?.trim();
  const priority = body.priority?.trim() || "Normal";

  if (!title) {
    throw new AppError("Title is required", 400);
  }

  if (!description) {
    throw new AppError("Description is required", 400);
  }

  if (!PRIORITIES.includes(priority)) {
    throw new AppError("Priority must be Low, Normal, or High", 400);
  }

  return {
    title,
    description,
    priority,
    isPinned: parseBoolean(body.isPinned, false),
  };
};

const buildAttachmentFromFile = async (userId, file) => {
  if (!file) {
    return null;
  }

  try {
    const path = generateFilePath(userId, file.originalname);
    const uploaded = await uploadFile(path, file.buffer, file.mimetype);

    return {
      fileName: file.originalname,
      fileUrl: uploaded.url || uploaded.public_url || uploaded.path || path,
      fileSize: file.size,
    };
  } catch (error) {
    throw new AppError(`Attachment upload failed: ${error.message}`, 500);
  }
};

export const createNoticeRecord = async (user, body, file) => {
  const payload = validateNoticeInput(body);
  let attachments = [];

  if (file) {
    const attachment = await buildAttachmentFromFile(user._id, file);
    if (attachment) {
      attachments = [attachment];
    }
  } else if (Array.isArray(body.attachments)) {
    attachments = body.attachments.filter(
      (item) => item?.fileName && item?.fileUrl,
    );
  }

  try {
    const notice = await Notice.create({
      ...payload,
      attachments,
      createdBy: user._id,
      createdByName: user.name,
    });

    return notice.populate("createdBy", "name email role");
  } catch (error) {
    throw mapMongooseError(error);
  }
};

export const listNotices = async () => {
  return Notice.find()
    .populate("createdBy", "name email role")
    .sort({ isPinned: -1, createdAt: -1 });
};

export const getNoticeById = async (noticeId) => {
  const notice = await Notice.findById(noticeId).populate(
    "createdBy",
    "name email role",
  );

  if (!notice) {
    throw new AppError("Notice not found", 404);
  }

  return notice;
};

export const updateNoticeRecord = async (user, noticeId, body, file) => {
  const notice = await Notice.findById(noticeId);

  if (!notice) {
    throw new AppError("Notice not found", 404);
  }

  if (!canModifyNotice(user, notice)) {
    throw new AppError("You can only update your own notices", 403);
  }

  const payload = validateNoticeInput(body);

  if (file) {
    const attachment = await buildAttachmentFromFile(user._id, file);
    if (attachment) {
      notice.attachments = [...(notice.attachments || []), attachment];
    }
  }

  notice.title = payload.title;
  notice.description = payload.description;
  notice.priority = payload.priority;
  notice.isPinned = payload.isPinned;
  notice.updatedAt = new Date();

  try {
    await notice.save();
    return notice.populate("createdBy", "name email role");
  } catch (error) {
    throw mapMongooseError(error);
  }
};

export const deleteNoticeRecord = async (user, noticeId) => {
  const notice = await Notice.findById(noticeId);

  if (!notice) {
    throw new AppError("Notice not found", 404);
  }

  if (!canModifyNotice(user, notice)) {
    throw new AppError("You can only delete your own notices", 403);
  }

  await notice.deleteOne();
  return notice;
};
