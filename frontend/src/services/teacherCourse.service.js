import api from "./api.js";
import { getTeacherDashboard } from "./api.js";

const unwrap = (data) => data?.data ?? data;

export const DEPARTMENTS = [
  { value: "CSE", label: "Computer Science & Engineering" },
  { value: "EEE", label: "Electrical & Electronic Engineering" },
  { value: "SWE", label: "Software Engineering" },
];

export const ACADEMIC_SESSION_PATTERN = /^\d{4}-\d{2}$/;

export const fetchTeacherCourses = async () => {
  const { data } = await api.get("/api/teachers/courses");
  return unwrap(data);
};

export const createTeacherCourse = async (payload) => {
  const { data } = await api.post("/api/teachers/courses", payload);
  return unwrap(data);
};

export const updateTeacherCourse = async (courseId, payload) => {
  const { data } = await api.put(`/api/teachers/courses/${courseId}`, payload);
  return unwrap(data);
};

export const archiveTeacherCourse = async (courseId) => {
  const { data } = await api.patch(`/api/teachers/courses/${courseId}/archive`);
  return unwrap(data);
};

export const deactivateTeacherCourse = async (courseId) => {
  const { data } = await api.patch(`/api/teachers/courses/${courseId}/deactivate`);
  return unwrap(data);
};

export const activateTeacherCourse = async (courseId) => {
  const { data } = await api.patch(`/api/teachers/courses/${courseId}/activate`);
  return unwrap(data);
};

export const deleteTeacherCourse = async (courseId) => {
  const { data } = await api.delete(`/api/teachers/courses/${courseId}`);
  return unwrap(data);
};

export const fetchTeacherDepartment = async () => {
  try {
    const dashboard = await getTeacherDashboard();
    const department = dashboard?.teacher?.department;
    return DEPARTMENTS.some((entry) => entry.value === department)
      ? department
      : "CSE";
  } catch {
    return "CSE";
  }
};

export default {
  DEPARTMENTS,
  ACADEMIC_SESSION_PATTERN,
  fetchTeacherCourses,
  createTeacherCourse,
  updateTeacherCourse,
  archiveTeacherCourse,
  deactivateTeacherCourse,
  activateTeacherCourse,
  deleteTeacherCourse,
  fetchTeacherDepartment,
};
