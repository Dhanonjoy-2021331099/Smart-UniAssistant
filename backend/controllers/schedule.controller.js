import AppError from "../utils/AppError.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { mapMongooseError } from "../utils/validators.js";
import {
  getMyRoutine,
  saveRoutine,
  generateSchedule,
  listSchedules,
  getSchedule,
  updateSchedule,
  publishSchedule,
  copySchedule,
  restoreVersion,
  deleteSchedule,
} from "../services/schedule.service.js";

const handleScheduleError = (res, error, context) => {
  console.error(`${context}:`, error);

  const mappedError =
    error instanceof AppError ? error : mapMongooseError(error);

  if (mappedError instanceof AppError) {
    return sendError(res, mappedError.statusCode, mappedError.message);
  }

  return sendError(res, 500, mappedError.message || "Internal server error");
};

export const getRoutine = async (req, res) => {
  try {
    const routine = await getMyRoutine(req.user);

    return sendSuccess(
      res,
      200,
      "Weekly routine retrieved successfully",
      routine,
    );
  } catch (error) {
    return handleScheduleError(res, error, "Get routine error");
  }
};

export const saveWeeklyRoutine = async (req, res) => {
  try {
    const routine = await saveRoutine(req.user, req.body);

    return sendSuccess(res, 200, "Weekly routine saved successfully", routine);
  } catch (error) {
    return handleScheduleError(res, error, "Save routine error");
  }
};

export const createScheduleForDate = async (req, res) => {
  try {
    const schedule = await generateSchedule(req.user, req.body);

    return sendSuccess(
      res,
      201,
      "Schedule generated successfully",
      schedule,
    );
  } catch (error) {
    return handleScheduleError(res, error, "Generate schedule error");
  }
};

export const getSchedules = async (req, res) => {
  try {
    const result = await listSchedules(req.user, req.query);

    return sendSuccess(res, 200, "Schedules retrieved successfully", result);
  } catch (error) {
    return handleScheduleError(res, error, "Get schedules error");
  }
};

export const getScheduleById = async (req, res) => {
  try {
    const schedule = await getSchedule(req.user, req.params.id);

    return sendSuccess(res, 200, "Schedule retrieved successfully", schedule);
  } catch (error) {
    return handleScheduleError(res, error, "Get schedule error");
  }
};

export const updateScheduleById = async (req, res) => {
  try {
    const schedule = await updateSchedule(req.user, req.params.id, req.body);

    return sendSuccess(res, 200, "Schedule updated successfully", schedule);
  } catch (error) {
    return handleScheduleError(res, error, "Update schedule error");
  }
};

export const publishScheduleById = async (req, res) => {
  try {
    const schedule = await publishSchedule(req.user, req.params.id);

    return sendSuccess(res, 200, "Schedule published successfully", schedule);
  } catch (error) {
    return handleScheduleError(res, error, "Publish schedule error");
  }
};

export const copyScheduleById = async (req, res) => {
  try {
    const schedule = await copySchedule(req.user, req.params.id, req.body);

    return sendSuccess(res, 201, "Schedule copied successfully", schedule);
  } catch (error) {
    return handleScheduleError(res, error, "Copy schedule error");
  }
};

export const restoreScheduleVersion = async (req, res) => {
  try {
    const schedule = await restoreVersion(
      req.user,
      req.params.id,
      req.params.historyId,
    );

    return sendSuccess(res, 200, "Schedule version restored successfully", schedule);
  } catch (error) {
    return handleScheduleError(res, error, "Restore schedule version error");
  }
};

export const deleteScheduleById = async (req, res) => {
  try {
    await deleteSchedule(req.user, req.params.id);

    return sendSuccess(res, 200, "Schedule deleted successfully");
  } catch (error) {
    return handleScheduleError(res, error, "Delete schedule error");
  }
};

export default {
  getRoutine,
  saveWeeklyRoutine,
  createScheduleForDate,
  getSchedules,
  getScheduleById,
  updateScheduleById,
  publishScheduleById,
  copyScheduleById,
  restoreScheduleVersion,
  deleteScheduleById,
};
