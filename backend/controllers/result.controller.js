import {
  listTeacherResults,
  createOrUpdateResult,
  bulkCreateResults,
  uploadResultFile,
  publishUploadedResults,
  publishResultPdf,
  publishResult,
  bulkPublishResults,
  replaceResult,
  replaceResultFile,
  getResultVersions,
  archiveResult,
  permanentlyDeleteResult,
  getStudentResults,
  downloadResultFile,
} from '../services/results.service.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

const statusOf = (error) => error.statusCode || error.status || 500;

const getFilters = (query) => ({
  teacherCourseId: query.teacherCourseId,
  courseId: query.courseId,
  semester: query.semester,
  courseCode: query.courseCode,
  academicSession: query.academicSession,
  resultType: query.resultType,
  status: query.status,
  publishedDate: query.publishedDate,
  search: query.search,
  page: query.page,
  limit: query.limit,
});

export const listResults = async (req, res) => {
  try {
    const data = await listTeacherResults(req.user, getFilters(req.query));
    return sendSuccess(res, 200, 'Results fetched successfully', data);
  } catch (error) {
    return sendError(res, statusOf(error), error.message || 'Failed to fetch results');
  }
};

export const createResult = async (req, res) => {
  try {
    const result = await createOrUpdateResult(req.user, req.body);
    return sendSuccess(res, 201, 'Result saved successfully', result);
  } catch (error) {
    return sendError(res, statusOf(error), error.message || 'Failed to save result');
  }
};

export const bulkCreate = async (req, res) => {
  try {
    const data = await bulkCreateResults(req.user, req.body);
    return sendSuccess(res, 201, 'Results saved successfully', data);
  } catch (error) {
    return sendError(res, statusOf(error), error.message || 'Failed to save results');
  }
};

export const uploadResult = async (req, res) => {
  try {
    const data = await uploadResultFile(req.user, req.body, req.file);
    return sendSuccess(res, 201, 'File uploaded successfully', data);
  } catch (error) {
    return sendError(res, statusOf(error), error.message || 'Failed to upload file');
  }
};

export const publish = async (req, res) => {
  try {
    const result = await publishResult(req.user, req.params.resultId);
    return sendSuccess(res, 200, 'Result published successfully', result);
  } catch (error) {
    return sendError(res, statusOf(error), error.message || 'Failed to publish result');
  }
};

export const publishUpload = async (req, res) => {
  try {
    const data = await publishUploadedResults(req.user, req.body);
    return sendSuccess(res, 200, 'Result published successfully', data);
  } catch (error) {
    return sendError(res, statusOf(error), error.message || 'Failed to publish result');
  }
};

export const publishPdf = async (req, res) => {
  try {
    const result = await publishResultPdf(req.user, req.body, req.file);
    return sendSuccess(res, 201, 'Result published successfully', result);
  } catch (error) {
    return sendError(res, statusOf(error), error.message || 'Failed to publish result');
  }
};

export const bulkPublish = async (req, res) => {
  try {
    const data = await bulkPublishResults(req.user, req.body.resultIds);
    return sendSuccess(res, 200, 'Results published successfully', data);
  } catch (error) {
    return sendError(res, statusOf(error), error.message || 'Failed to publish results');
  }
};

export const replace = async (req, res) => {
  try {
    const result = await replaceResult(req.user, req.params.resultId, req.body);
    return sendSuccess(res, 200, 'Result replaced successfully', result);
  } catch (error) {
    return sendError(res, statusOf(error), error.message || 'Failed to replace result');
  }
};

export const replaceFile = async (req, res) => {
  try {
    const result = await replaceResultFile(req.user, req.params.resultId, {
      file: req.file,
      reason: req.body.reason,
    });
    return sendSuccess(res, 200, 'Result PDF replaced successfully', result);
  } catch (error) {
    return sendError(res, statusOf(error), error.message || 'Failed to replace result PDF');
  }
};

export const versions = async (req, res) => {
  try {
    const data = await getResultVersions(req.user, req.params.resultId);
    return sendSuccess(res, 200, 'Result versions fetched successfully', data);
  } catch (error) {
    return sendError(res, statusOf(error), error.message || 'Failed to fetch versions');
  }
};

export const archive = async (req, res) => {
  try {
    const result = await archiveResult(req.user, req.params.resultId);
    return sendSuccess(res, 200, 'Result archived successfully', result);
  } catch (error) {
    return sendError(res, statusOf(error), error.message || 'Failed to archive result');
  }
};

export const permanentDelete = async (req, res) => {
  try {
    await permanentlyDeleteResult(req.user, req.params.resultId);
    return sendSuccess(res, 200, 'Result deleted permanently');
  } catch (error) {
    return sendError(res, statusOf(error), error.message || 'Failed to delete result');
  }
};

export const myResults = async (req, res) => {
  try {
    const data = await getStudentResults(req.user, getFilters(req.query));
    return sendSuccess(res, 200, 'Results fetched successfully', data);
  } catch (error) {
    return sendError(res, statusOf(error), error.message || 'Failed to fetch results');
  }
};

export const download = async (req, res) => {
  try {
    const { data, contentType, fileName } = await downloadResultFile(
      req.user,
      req.params.resultId,
    );

    res.setHeader('Content-Type', contentType || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileName}"`,
    );

    return res.send(data);
  } catch (error) {
    return sendError(res, statusOf(error), error.message || 'Failed to download file');
  }
};
