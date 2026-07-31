import { sendError } from "../utils/apiResponse.js";

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, "Authentication required");
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(res, 403, "Access denied. Insufficient permissions.");
    }

    next();
  };
};

export const requireStudent = requireRole("student");
export const requireTeacher = requireRole("teacher");
export const requireCRAdmin = requireRole("cr_admin");
export const requireSuperAdmin = requireRole("super_admin");
export const requireNoticeManager = requireRole("super_admin", "cr_admin");
export const requireNoticeViewer = requireRole(
  "student",
  "teacher",
  "cr_admin",
  "super_admin",
);

export default {
  requireRole,
  requireStudent,
  requireTeacher,
  requireCRAdmin,
  requireSuperAdmin,
  requireNoticeManager,
  requireNoticeViewer,
};
