import path from "path";
import Notice from "../models/Notice.js";
import AppError from "../utils/AppError.js";
import {
  uploadFile,
  generateFilePath,
  validateAttachmentFile,
  getUploadUrl,
} from "../config/storage.js";
import { createNoticeNotifications } from "./notification.service.js";
import { mapMongooseError } from "../utils/validators.js";

export const CATEGORIES = ["Academic", "Exam", "Assignment", "Event", "General"];
export const PRIORITIES = ["Normal", "Important", "Urgent"];
export const STATUSES = ["draft", "published", "archived"];

const MAX_ATTACHMENTS = 10;

const parseBoolean = (value, defaultValue = false) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }

  return defaultValue;
};

const parseDate = (value, fallback = null) => {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new AppError("Invalid date value provided", 400);
  }

  return date;
};

export const canModifyNotice = (user, notice) => {
  if (!user || !notice) {
    return false;
  }

  if (user.role === "super_admin") {
    return true;
  }

  if (user.role === "cr_admin" || user.role === "teacher") {
    const creatorId = notice.createdBy?._id || notice.createdBy;
    return creatorId?.toString() === user._id.toString();
  }

  return false;
};

export const canViewNotice = (user, notice) => {
  if (!user || !notice) {
    return false;
  }

  if (notice.status === "published") {
    return true;
  }

  return canModifyNotice(user, notice);
};

export const validateNoticeInput = (body) => {
  const title = body.title?.trim();
  const description = body.description?.trim();
  const category = body.category?.trim() || "General";
  const priority = body.priority?.trim() || "Normal";
  const status = body.status?.trim() || "published";

  if (!title) {
    throw new AppError("Title is required", 400);
  }

  if (!description) {
    throw new AppError("Description is required", 400);
  }

  if (!CATEGORIES.includes(category)) {
    throw new AppError(
      `Category must be one of: ${CATEGORIES.join(", ")}`,
      400,
    );
  }

  if (!PRIORITIES.includes(priority)) {
    throw new AppError(
      `Priority must be one of: ${PRIORITIES.join(", ")}`,
      400,
    );
  }

  if (!STATUSES.includes(status)) {
    throw new AppError(
      `Status must be one of: ${STATUSES.join(", ")}`,
      400,
    );
  }

  return {
    title,
    description,
    category,
    priority,
    status,
    isPinned: parseBoolean(body.isPinned, false),
    publishDate: parseDate(body.publishDate, null),
    expiryDate: parseDate(body.expiryDate, null),
  };
};

const validateNoticeDates = (payload) => {
  const publishDate = payload.publishDate;
  const expiryDate = payload.expiryDate;

  if (
    expiryDate &&
    publishDate &&
    expiryDate.getTime() < publishDate.getTime()
  ) {
    throw new AppError("Expiry date cannot be before publish date", 400);
  }
};

const buildAttachmentsFromFiles = async (userId, files) => {
  const attachments = [];

  for (const file of files || []) {
    validateAttachmentFile(file);
    const relativePath = generateFilePath(userId, file.originalname);
    const uploaded = await uploadFile(relativePath, file.buffer, file.mimetype);

    attachments.push({
      fileName: file.originalname,
      fileUrl: getUploadUrl(uploaded, relativePath),
      fileSize: file.size,
    });
  }

  return attachments;
};

export const createNoticeRecord = async (user, body, files) => {
  const payload = validateNoticeInput(body);
  validateNoticeDates(payload);

  const attachments = await buildAttachmentsFromFiles(user._id, files);

  const publishDate =
    payload.status === "draft" && payload.publishDate
      ? payload.publishDate
      : payload.publishDate || new Date();

  let notice;

  try {
    notice = await Notice.create({
      ...payload,
      publishDate,
      attachments,
      authorName: user.name,
      authorUID: user.firebaseUid || null,
      authorRole: user.role,
      createdBy: user._id,
    });

    notice = await notice.populate("createdBy", "name email role");
  } catch (error) {
    throw mapMongooseError(error);
  }

  if (payload.status === "published") {
    await createNoticeNotifications(notice);
  }

  return notice;
};

export const listNotices = async (user, query = {}) => {
  const {
    search = "",
    category = "",
    priority = "",
    status = "",
    page = 1,
    limit = 10,
  } = query;

  const filter = {};

  if (user.role === "student") {
    filter.status = "published";
  } else if (user.role === "cr_admin" || user.role === "teacher") {
    filter.createdBy = user._id;
    if (status) {
      filter.status = status;
    }
  } else {
    if (status) {
      filter.status = status;
    }
  }

  if (category) {
    filter.category = category;
  }

  if (priority) {
    filter.priority = priority;
  }

  if (search) {
    const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ title: searchRegex }, { description: searchRegex }];
  }

  const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
  const limitNumber = Math.min(
    Math.max(parseInt(limit, 10) || 10, 1),
    50,
  );
  const skip = (pageNumber - 1) * limitNumber;

  const [notices, total] = await Promise.all([
    Notice.find(filter)
      .populate("createdBy", "name email role")
      .sort({ isPinned: -1, publishDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNumber),
    Notice.countDocuments(filter),
  ]);

  return {
    notices,
    total,
    page: pageNumber,
    pages: Math.max(Math.ceil(total / limitNumber), 1),
    limit: limitNumber,
  };
};

export const getNoticeById = async (user, noticeId) => {
  const notice = await Notice.findById(noticeId).populate(
    "createdBy",
    "name email role",
  );

  if (!notice) {
    throw new AppError("Notice not found", 404);
  }

  if (!canViewNotice(user, notice)) {
    throw new AppError("Notice not found", 404);
  }

  if (!canModifyNotice(user, notice)) {
    notice.viewCount = (notice.viewCount || 0) + 1;
    notice.updatedAt = new Date();
    await notice.save();
  }

  return notice;
};

export const updateNoticeRecord = async (user, noticeId, body, files) => {
  const notice = await Notice.findById(noticeId);

  if (!notice) {
    throw new AppError("Notice not found", 404);
  }

  if (!canModifyNotice(user, notice)) {
    throw new AppError("You can only update your own notices", 403);
  }

  const payload = validateNoticeInput(body);
  validateNoticeDates(payload);

  const wasPublished = notice.status === "published";

  notice.title = payload.title;
  notice.description = payload.description;
  notice.category = payload.category;
  notice.priority = payload.priority;
  notice.isPinned = payload.isPinned;

  if (payload.status !== notice.status) {
    notice.status = payload.status;

    if (notice.status === "published" && !notice.publishDate) {
      notice.publishDate = new Date();
    }
  }

  if (payload.publishDate) {
    notice.publishDate = payload.publishDate;
  }

  notice.expiryDate = payload.expiryDate || null;

  const currentAttachments = Array.isArray(notice.attachments) && notice.attachments.length > 0
    ? notice.attachments
    : notice.attachment
      ? [notice.attachment]
      : [];

  let existingAttachments = [];

  try {
    existingAttachments = body.existingAttachments
      ? JSON.parse(body.existingAttachments)
      : null;
  } catch (error) {
    existingAttachments = null;
  }

  const keptIndexes = Array.isArray(existingAttachments)
    ? existingAttachments
    : currentAttachments.map((_, index) => index);
  const validKeptIndexes = keptIndexes.filter(
    (index) =>
      Number.isInteger(index) &&
      index >= 0 &&
      index < currentAttachments.length,
  );

  notice.attachments = currentAttachments.filter((_, index) =>
    validKeptIndexes.includes(index),
  );

  if (notice.attachment) {
    notice.attachment = undefined;
  }

  if (Array.isArray(files) && files.length > 0) {
    const uploaded = await buildAttachmentsFromFiles(user._id, files);
    notice.attachments.push(...uploaded);
  }

  try {
    await notice.save();
    const updated = await notice.populate("createdBy", "name email role");

    if (notice.status === "published" && !wasPublished) {
      await createNoticeNotifications(updated);
    }

    return updated;
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

export const toggleNoticePin = async (user, noticeId) => {
  const notice = await Notice.findById(noticeId);

  if (!notice) {
    throw new AppError("Notice not found", 404);
  }

  if (!canModifyNotice(user, notice)) {
    throw new AppError("You can only pin your own notices", 403);
  }

  notice.isPinned = !notice.isPinned;
  await notice.save();

  return notice;
};

export const changeNoticeStatus = async (user, noticeId, status) => {
  if (!STATUSES.includes(status)) {
    throw new AppError(
      `Status must be one of: ${STATUSES.join(", ")}`,
      400,
    );
  }

  const notice = await Notice.findById(noticeId);

  if (!notice) {
    throw new AppError("Notice not found", 404);
  }

  if (!canModifyNotice(user, notice)) {
    throw new AppError("You can only change your own notices", 403);
  }

  notice.status = status;

  if (status === "published" && !notice.publishDate) {
    notice.publishDate = new Date();
  }

  await notice.save();
  const updated = await notice.populate("createdBy", "name email role");

  if (status === "published") {
    await createNoticeNotifications(updated);
  }

  return updated;
};
