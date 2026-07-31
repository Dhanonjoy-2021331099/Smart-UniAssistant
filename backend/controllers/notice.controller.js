import AppError from "../utils/AppError.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { mapMongooseError } from "../utils/validators.js";
import {
  createNoticeRecord,
  listNotices,
  getNoticeById,
  updateNoticeRecord,
  deleteNoticeRecord,
} from "../services/notice.service.js";

const handleNoticeError = (res, error, context) => {
  console.error(`${context}:`, error);

  const mappedError =
    error instanceof AppError ? error : mapMongooseError(error);

  if (mappedError instanceof AppError) {
    return sendError(res, mappedError.statusCode, mappedError.message);
  }

  return sendError(res, 500, mappedError.message || "Internal server error");
};

export const createNotice = async (req, res) => {
  try {
    const notice = await createNoticeRecord(req.user, req.body, req.file);

    return sendSuccess(res, 201, "Notice created successfully", notice);
  } catch (error) {
    return handleNoticeError(res, error, "Create notice error");
  }
};

export const getNotices = async (req, res) => {
  try {
    const notices = await listNotices();

    return sendSuccess(res, 200, "Notices retrieved successfully", notices);
  } catch (error) {
    return handleNoticeError(res, error, "Get notices error");
  }
};

export const getNotice = async (req, res) => {
  try {
    const notice = await getNoticeById(req.params.id);

    return sendSuccess(res, 200, "Notice retrieved successfully", notice);
  } catch (error) {
    return handleNoticeError(res, error, "Get notice error");
  }
};

export const updateNotice = async (req, res) => {
  try {
    const notice = await updateNoticeRecord(
      req.user,
      req.params.id,
      req.body,
      req.file,
    );

    return sendSuccess(res, 200, "Notice updated successfully", notice);
  } catch (error) {
    return handleNoticeError(res, error, "Update notice error");
  }
};

export const deleteNotice = async (req, res) => {
  try {
    await deleteNoticeRecord(req.user, req.params.id);

    return sendSuccess(res, 200, "Notice deleted successfully");
  } catch (error) {
    return handleNoticeError(res, error, "Delete notice error");
  }
};

export default {
  createNotice,
  getNotices,
  getNotice,
  updateNotice,
  deleteNotice,
};
