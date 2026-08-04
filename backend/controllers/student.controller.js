import Student from "../models/Student.js";
import { DEPARTMENTS } from "../models/TeacherCourse.js";
import Result from "../models/Result.js";
import CourseMaterial from "../models/CourseMaterial.js";
import Course from "../models/Course.js";
import {
  listAssignmentsForStudent,
  listMaterialsForStudent,
  attachCourseView,
  resolveStudentTeacherCourseIds,
} from "../services/teacherAssignment.service.js";
import { listStudentCourses } from "../services/studentCourses.service.js";
import { getStudentResults } from "../services/results.service.js";

export const getDashboard = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id })
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
      .populate("teacherCourseId")
      .populate("course")
      .sort({ createdAt: -1 })
      .limit(5);

    const [assignments, recentMaterials] = await Promise.all([
      listAssignmentsForStudent(req.user, { upcomingOnly: true, limit: 5 }),
      listMaterialsForStudent(req.user),
    ]);

    res.json({
      student,
      results: results.map(attachCourseView),
      assignments,
      recentMaterials: recentMaterials.slice(0, 5),
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
    const data = await getStudentResults(req.user, req.query);
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to fetch results' });
  }
};

export const getAssignments = async (req, res) => {
  try {
    const assignments = await listAssignmentsForStudent(req.user, {});
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCourses = async (req, res) => {
  try {
    const data = await listStudentCourses(req.user);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { department, semester, section, academicSession } = req.body;
    const student = await Student.findOne({ userId: req.user._id });

    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    if (department !== undefined) {
      if (!DEPARTMENTS.includes(department)) {
        return res.status(400).json({ error: 'Invalid department' });
      }
      student.department = department;
    }

    if (semester !== undefined) student.semester = String(semester);
    if (section !== undefined) student.section = String(section);
    if (academicSession !== undefined) student.academicSession = String(academicSession);

    student.session = student.academicSession || student.session;
    student.updatedAt = new Date();
    await student.save();

    res.json({ student });
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

    const { courseId, teacherCourseId } = req.query;

    const teacherCourseIds = await resolveStudentTeacherCourseIds(student);

    const query = {
      isPublished: true,
    };

    if (teacherCourseId) {
      query.teacherCourseId = teacherCourseId;
    } else if (courseId) {
      query.course = courseId;
    } else {
      query.teacherCourseId = { $in: teacherCourseIds };
    }

    const materials = await CourseMaterial.find(query)
      .populate("teacherCourseId")
      .populate("course")
      .populate("teacher")
      .sort({ createdAt: -1 });

    res.json(materials.map(attachCourseView));
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

    results
      .filter((result) => {
        const isLegacy = !result.resultType;
        const isFinal =
          result.resultType === "final" ||
          result.resultType === "final_published";

        return (isLegacy || isFinal) && result.gradePoint && result.course?.credit;
      })
      .forEach((result) => {
        totalPoints += result.gradePoint * result.course.credit;
        totalCredits += result.course.credit;
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
  getCourses,
  updateProfile,
};
