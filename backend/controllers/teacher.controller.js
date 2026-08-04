import Teacher from "../models/Teacher.js";
import TeacherCourse from "../models/TeacherCourse.js";
import {
  uploadCourseMaterial as uploadCourseMaterialService,
  createAssignment as createAssignmentService,
  getAssignmentSubmissions as getAssignmentSubmissionsService,
  gradeSubmission as gradeSubmissionService,
} from "../services/teacherAssignment.service.js";
import { uploadComponentResults } from "../services/results.service.js";

const statusOf = (error) => error.statusCode || error.status || 500;

export const getDashboard = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user._id });

    if (!teacher) {
      return res.json({ teacher: null, courses: [] });
    }

    const teacherCourses = await TeacherCourse.find({
      teacher: teacher._id,
      status: { $ne: "archived" },
    })
      .sort({ semester: 1, courseCode: 1, createdAt: -1 });

    res.json({ teacher, courses: teacherCourses });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMyCourses = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return res.json([]);
    }

    const courses = await TeacherCourse.find({
      teacher: teacher._id,
      status: { $ne: "archived" },
    })
      .sort({ semester: 1, createdAt: -1 });

    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const uploadCourseMaterial = async (req, res) => {
  try {
    const material = await uploadCourseMaterialService(
      req.user,
      req.body,
      req.file,
    );
    res.status(201).json(material);
  } catch (error) {
    res
      .status(statusOf(error))
      .json({ error: error.message || "Failed to upload course material" });
  }
};

export const createAssignment = async (req, res) => {
  try {
    const assignment = await createAssignmentService(req.user, req.body);
    res.status(201).json(assignment);
  } catch (error) {
    res
      .status(statusOf(error))
      .json({ error: error.message || "Failed to create assignment" });
  }
};

export const getAssignmentSubmissions = async (req, res) => {
  try {
    const submissions = await getAssignmentSubmissionsService(
      req.user,
      req.params.assignmentId,
    );
    res.json(submissions);
  } catch (error) {
    res
      .status(statusOf(error))
      .json({ error: error.message || "Failed to fetch submissions" });
  }
};

export const gradeSubmission = async (req, res) => {
  try {
    const submission = await gradeSubmissionService(
      req.user,
      req.params.submissionId,
      req.body,
    );
    res.json(submission);
  } catch (error) {
    res
      .status(statusOf(error))
      .json({ error: error.message || "Failed to grade submission" });
  }
};

export const uploadResults = async (req, res) => {
  try {
    const data = await uploadComponentResults(req.user, req.body);
    res.status(201).json(data);
  } catch (error) {
    res
      .status(statusOf(error))
      .json({ error: error.message || "Failed to upload results" });
  }
};

export default {
  getDashboard,
  getMyCourses,
  uploadCourseMaterial,
  createAssignment,
  getAssignmentSubmissions,
  gradeSubmission,
  uploadResults,
};
