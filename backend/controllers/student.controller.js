import Student from "../models/Student.js";
import Result from "../models/Result.js";
import Assignment from "../models/Assignment.js";
import Submission from "../models/Submission.js";
import CourseMaterial from "../models/CourseMaterial.js";
import Course from "../models/Course.js";

export const getDashboard = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id })
      .populate("department")
      .populate("batch")
      .populate("enrolledCourses");

    if (!student) {
      return res.json({
        student: null,
        results: [],
        assignments: [],
        recentMaterials: [],
        stats: {
          overallCGPA: 0,
          totalCredits: 0,
          currentSemester: 1,
        },
      });
    }

    const results = await Result.find({
      student: student._id,
      isPublished: true,
    })
      .populate("course")
      .sort({ createdAt: -1 });

    const assignments = await Assignment.find({
      batch: student.batch,
      isPublished: true,
      dueDate: { $gte: new Date() },
    })
      .populate("course")
      .populate("teacher")
      .sort({ dueDate: 1 })
      .limit(5);

    const recentMaterials = await CourseMaterial.find({
      batch: student.batch,
      isPublished: true,
    })
      .populate("course")
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      student,
      results,
      assignments,
      recentMaterials,
      stats: {
        overallCGPA: student.overallCGPA,
        totalCredits: student.totalCreditsCompleted,
        currentSemester: student.currentSemester,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getResults = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.json([]);
    }

    const results = await Result.find({
      student: student._id,
      isPublished: true,
    })
      .populate("course")
      .sort({ semester: -1, createdAt: -1 });

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAssignments = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.json([]);
    }

    const assignments = await Assignment.find({
      batch: student.batch,
      isPublished: true,
    })
      .populate("course")
      .populate("teacher")
      .sort({ dueDate: -1 });

    const submissions = await Submission.find({ student: student._id });
    const submissionMap = {};
    submissions.forEach((sub) => {
      submissionMap[sub.assignment.toString()] = sub;
    });

    const assignmentsWithStatus = assignments.map((assignment) => ({
      ...assignment.toObject(),
      submission: submissionMap[assignment._id.toString()] || null,
    }));

    res.json(assignmentsWithStatus);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCourseMaterials = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.json([]);
    }
    const { courseId } = req.query;

    const query = {
      batch: student.batch,
      isPublished: true,
    };

    if (courseId) {
      query.course = courseId;
    }

    const materials = await CourseMaterial.find(query)
      .populate("course")
      .populate("teacher")
      .sort({ createdAt: -1 });

    res.json(materials);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const calculateCGPA = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) {
      return res.json({ cgpa: "0.00", totalCredits: 0 });
    }

    const results = await Result.find({
      student: student._id,
      isPublished: true,
    }).populate("course");

    let totalPoints = 0;
    let totalCredits = 0;

    results.forEach((result) => {
      if (result.gradePoint && result.course.credit) {
        totalPoints += result.gradePoint * result.course.credit;
        totalCredits += result.course.credit;
      }
    });

    const cgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;

    student.overallCGPA = cgpa;
    student.totalCreditsCompleted = totalCredits;
    await student.save();

    res.json({ cgpa, totalCredits });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default {
  getDashboard,
  getResults,
  getAssignments,
  getCourseMaterials,
  calculateCGPA,
};
