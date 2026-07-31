import mongoose from "mongoose";
import Department from "../models/Department.js";
import Batch from "../models/Batch.js";
import AppError from "./AppError.js";

const REGISTERABLE_ROLES = ["student", "teacher", "cr_admin"];

export const isValidObjectId = (value) => {
  if (!value || typeof value !== "string") {
    return false;
  }

  return (
    mongoose.Types.ObjectId.isValid(value) &&
    String(new mongoose.Types.ObjectId(value)) === value
  );
};

export const normalizeEmail = (email) => email?.trim().toLowerCase();

export const sanitizeString = (value) =>
  typeof value === "string" ? value.trim() : value;

export const assertRequiredFields = (fields) => {
  const missing = Object.entries(fields)
    .filter(([, value]) => value === undefined || value === null || value === "")
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new AppError(`Missing required fields: ${missing.join(", ")}`, 400);
  }
};

export const validateRole = (role, allowedRoles = REGISTERABLE_ROLES) => {
  if (!allowedRoles.includes(role)) {
    throw new AppError(
      `Invalid role. Allowed roles: ${allowedRoles.join(", ")}`,
      400,
    );
  }
};

export const validateDepartmentExists = async (departmentId) => {
  if (!isValidObjectId(departmentId)) {
    throw new AppError("Invalid department ID", 400);
  }

  const department = await Department.findById(departmentId);

  if (!department) {
    throw new AppError("Department not found", 404);
  }

  if (department.isActive === false) {
    throw new AppError("Department is inactive", 400);
  }

  return department;
};

export const validateBatchExists = async (batchId, departmentId = null) => {
  if (!isValidObjectId(batchId)) {
    throw new AppError("Invalid batch ID", 400);
  }

  const batch = await Batch.findById(batchId);

  if (!batch) {
    throw new AppError("Batch not found", 404);
  }

  if (batch.isActive === false) {
    throw new AppError("Batch is inactive", 400);
  }

  if (
    departmentId &&
    batch.department.toString() !== departmentId.toString()
  ) {
    throw new AppError("Batch does not belong to the specified department", 400);
  }

  return batch;
};

export const validateRegisterPayload = async (body) => {
  const email = normalizeEmail(body.email);
  const password = body.password;
  const name = sanitizeString(body.name);
  const role = sanitizeString(body.role);
  const studentId = sanitizeString(body.studentId);
  const teacherId = sanitizeString(body.teacherId);
  const department = sanitizeString(body.department);
  const batch = sanitizeString(body.batch);

  assertRequiredFields({ email, password, name, role });
  validateRole(role);

  if (password.length < 6) {
    throw new AppError("Password must be at least 6 characters", 400);
  }

  const payload = { email, password, name, role };

  if (role === "student") {
    assertRequiredFields({ studentId, department, batch });
    await validateDepartmentExists(department);
    await validateBatchExists(batch, department);
    return { ...payload, studentId, department, batch };
  }

  if (role === "teacher") {
    assertRequiredFields({ teacherId, department });
    await validateDepartmentExists(department);
    return { ...payload, teacherId, department };
  }

  if (role === "cr_admin") {
    assertRequiredFields({ studentId, department, batch });
    await validateDepartmentExists(department);
    await validateBatchExists(batch, department);
    return { ...payload, studentId, department, batch };
  }

  throw new AppError("Unsupported role", 400);
};

export const validateCompleteProfilePayload = async (body) => {
  const role = sanitizeString(body.role);
  const studentId = sanitizeString(body.studentId);
  const teacherId = sanitizeString(body.teacherId);
  const department = sanitizeString(body.department);
  const batch = sanitizeString(body.batch);

  assertRequiredFields({ role });
  validateRole(role);

  const payload = { role };

  if (role === "student") {
    assertRequiredFields({ studentId, department, batch });
    await validateDepartmentExists(department);
    await validateBatchExists(batch, department);
    return { ...payload, studentId, department, batch };
  }

  if (role === "teacher") {
    assertRequiredFields({ teacherId, department });
    await validateDepartmentExists(department);
    return { ...payload, teacherId, department };
  }

  if (role === "cr_admin") {
    assertRequiredFields({ studentId, department, batch });
    await validateDepartmentExists(department);
    await validateBatchExists(batch, department);
    return { ...payload, studentId, department, batch };
  }

  throw new AppError("Unsupported role", 400);
};

export const mapMongooseError = (error) => {
  if (error?.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0] || "field";
    return new AppError(`${field} already exists`, 409);
  }

  if (error?.name === "ValidationError") {
    const messages = Object.values(error.errors).map((entry) => entry.message);
    return new AppError(messages.join(", "), 400);
  }

  return error;
};
