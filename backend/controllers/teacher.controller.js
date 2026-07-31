import Teacher from "../models/Teacher.js";
import TeacherCourse from "../models/TeacherCourse.js";
import Assignment from "../models/Assignment.js";
import Submission from "../models/Submission.js";
import CourseMaterial from "../models/CourseMaterial.js";
import Result from "../models/Result.js";
import { uploadFile, generateFilePath } from "../config/storage.js";
import File from "../models/File.js";

export const getDashboard = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user._id })
      .populate("department")
      .populate("assignedCourses.course")
      .populate("assignedCourses.batch");

    if (!teacher) {
      return res.json({ teacher: null, courses: [] });
    }

    const teacherCourses = await TeacherCourse.find({
      teacher: teacher._id,
      isActive: true,
    })
      .populate("course")
      .populate("batch");

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
      isActive: true,
    })
      .populate("course")
      .populate("batch");

    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const uploadCourseMaterial = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return res.status(404).json({ error: "Teacher profile not found" });
    }
    const { courseId, batchId, title, description, type, externalLink } =
      req.body;

    const teacherCourse = await TeacherCourse.findOne({
      teacher: teacher._id,
      course: courseId,
      batch: batchId,
      isActive: true,
    });

    if (!teacherCourse) {
      return res
        .status(403)
        .json({ error: "You are not assigned to this course" });
    }

    let filePath = null;
    let fileName = null;
    let fileSize = null;

    if (req.file) {
      const path = generateFilePath(
        req.user._id.toString(),
        req.file.originalname,
      );
      const result = await uploadFile(path, req.file.buffer, req.file.mimetype);

      await File.create({
        originalFileName: req.file.originalname,
        storagePath: result.path,
        contentType: req.file.mimetype,
        size: result.size,
        uploadedBy: req.user._id,
        relatedModel: "CourseMaterial",
      });

      filePath = result.path;
      fileName = req.file.originalname;
      fileSize = result.size;
    }

    const material = await CourseMaterial.create({
      course: courseId,
      batch: batchId,
      teacher: teacher._id,
      title,
      description,
      type,
      filePath,
      fileName,
      fileSize,
      externalLink,
      uploadedBy: req.user._id,
    });

    res.status(201).json(material);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createAssignment = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return res.status(404).json({ error: "Teacher profile not found" });
    }
    const {
      courseId,
      batchId,
      title,
      description,
      instructions,
      maxMarks,
      dueDate,
      isPublished,
    } = req.body;

    const teacherCourse = await TeacherCourse.findOne({
      teacher: teacher._id,
      course: courseId,
      batch: batchId,
      isActive: true,
    });

    if (!teacherCourse) {
      return res
        .status(403)
        .json({ error: "You are not assigned to this course" });
    }

    const assignment = await Assignment.create({
      course: courseId,
      batch: batchId,
      teacher: teacher._id,
      title,
      description,
      instructions,
      maxMarks,
      dueDate,
      isPublished: isPublished || false,
      createdBy: req.user._id,
    });

    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAssignmentSubmissions = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return res.status(404).json({ error: "Teacher profile not found" });
    }
    const { assignmentId } = req.params;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    if (assignment.teacher.toString() !== teacher._id.toString()) {
      return res.status(403).json({ error: "Access denied" });
    }

    const submissions = await Submission.find({ assignment: assignmentId })
      .populate("student")
      .populate("submittedBy")
      .sort({ submittedAt: -1 });

    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const gradeSubmission = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return res.status(404).json({ error: "Teacher profile not found" });
    }
    const { submissionId } = req.params;
    const { marks, feedback } = req.body;

    const submission =
      await Submission.findById(submissionId).populate("assignment");
    if (!submission) {
      return res.status(404).json({ error: "Submission not found" });
    }

    if (submission.assignment.teacher.toString() !== teacher._id.toString()) {
      return res.status(403).json({ error: "Access denied" });
    }

    submission.marks = marks;
    submission.feedback = feedback;
    submission.status = "graded";
    submission.gradedBy = req.user._id;
    submission.gradedAt = new Date();
    await submission.save();

    res.json(submission);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const uploadResults = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) {
      return res.status(404).json({ error: "Teacher profile not found" });
    }
    const { courseId, batchId, results } = req.body;

    const teacherCourse = await TeacherCourse.findOne({
      teacher: teacher._id,
      course: courseId,
      batch: batchId,
      isActive: true,
    });

    if (!teacherCourse) {
      return res
        .status(403)
        .json({ error: "You are not assigned to this course" });
    }

    const savedResults = [];

    for (const resultData of results) {
      const {
        studentId,
        quizMarks,
        assignmentMarks,
        labMarks,
        midMarks,
        finalMarks,
      } = resultData;

      const totalMarks =
        (quizMarks || 0) +
        (assignmentMarks || 0) +
        (labMarks || 0) +
        (midMarks || 0) +
        (finalMarks || 0);
      const { letterGrade, gradePoint } = calculateGrade(totalMarks);

      const result = await Result.findOneAndUpdate(
        { student: studentId, course: courseId },
        {
          batch: batchId,
          quizMarks,
          assignmentMarks,
          labMarks,
          midMarks,
          finalMarks,
          totalMarks,
          letterGrade,
          gradePoint,
          isPublished: false,
          createdBy: req.user._id,
        },
        { new: true, upsert: true },
      );

      savedResults.push(result);
    }

    res.status(201).json(savedResults);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const calculateGrade = (totalMarks) => {
  if (totalMarks >= 90) return { letterGrade: "A+", gradePoint: 4.0 };
  if (totalMarks >= 85) return { letterGrade: "A", gradePoint: 3.75 };
  if (totalMarks >= 80) return { letterGrade: "A-", gradePoint: 3.5 };
  if (totalMarks >= 75) return { letterGrade: "B+", gradePoint: 3.25 };
  if (totalMarks >= 70) return { letterGrade: "B", gradePoint: 3.0 };
  if (totalMarks >= 65) return { letterGrade: "B-", gradePoint: 2.75 };
  if (totalMarks >= 60) return { letterGrade: "C+", gradePoint: 2.5 };
  if (totalMarks >= 55) return { letterGrade: "C", gradePoint: 2.25 };
  if (totalMarks >= 50) return { letterGrade: "D", gradePoint: 2.0 };
  return { letterGrade: "F", gradePoint: 0.0 };
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
