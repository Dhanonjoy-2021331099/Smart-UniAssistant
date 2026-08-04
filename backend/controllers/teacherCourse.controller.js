import {
  listTeacherCourses,
  createTeacherCourse,
  updateTeacherCourse,
  archiveTeacherCourse,
  deactivateTeacherCourse,
  activateTeacherCourse,
  removeTeacherCourse,
} from '../services/teacherCourse.service.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

const statusOf = (error) =>
  error.statusCode || error.status || 500;

export const listCourses = async (req, res) => {
  try {
    const data = await listTeacherCourses(req.user, {
      includeArchived: req.query.includeArchived === 'true',
    });
    return sendSuccess(res, 200, 'Courses fetched successfully', data);
  } catch (error) {
    return sendError(res, statusOf(error), error.message || 'Failed to fetch courses');
  }
};

export const createCourse = async (req, res) => {
  try {
    const data = await createTeacherCourse(req.user, req.body);
    return sendSuccess(res, 201, 'Course added to your profile', data);
  } catch (error) {
    return sendError(res, statusOf(error), error.message || 'Failed to add course');
  }
};

export const updateCourse = async (req, res) => {
  try {
    const data = await updateTeacherCourse(req.user, req.params.courseId, req.body);
    return sendSuccess(res, 200, 'Course updated successfully', data);
  } catch (error) {
    return sendError(res, statusOf(error), error.message || 'Failed to update course');
  }
};

export const archiveCourse = async (req, res) => {
  try {
    const data = await archiveTeacherCourse(req.user, req.params.courseId);
    return sendSuccess(res, 200, 'Course archived', data);
  } catch (error) {
    return sendError(res, statusOf(error), error.message || 'Failed to archive course');
  }
};

export const deactivateCourse = async (req, res) => {
  try {
    const data = await deactivateTeacherCourse(req.user, req.params.courseId);
    return sendSuccess(res, 200, 'Course deactivated', data);
  } catch (error) {
    return sendError(res, statusOf(error), error.message || 'Failed to deactivate course');
  }
};

export const activateCourse = async (req, res) => {
  try {
    const data = await activateTeacherCourse(req.user, req.params.courseId);
    return sendSuccess(res, 200, 'Course activated', data);
  } catch (error) {
    return sendError(res, statusOf(error), error.message || 'Failed to activate course');
  }
};

export const deleteCourse = async (req, res) => {
  try {
    await removeTeacherCourse(req.user, req.params.courseId);
    return sendSuccess(res, 200, 'Course removed from your profile');
  } catch (error) {
    return sendError(res, statusOf(error), error.message || 'Failed to remove course');
  }
};

export default {
  listCourses,
  createCourse,
  updateCourse,
  archiveCourse,
  deactivateCourse,
  activateCourse,
  deleteCourse,
};
