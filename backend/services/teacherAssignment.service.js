import Teacher from '../models/Teacher.js';
import TeacherCourse from '../models/TeacherCourse.js';
import Student from '../models/Student.js';
import Course from '../models/Course.js';
import CourseMaterial from '../models/CourseMaterial.js';
import Assignment from '../models/Assignment.js';
import Submission from '../models/Submission.js';
import File from '../models/File.js';
import AppError from '../utils/AppError.js';
import { isValidObjectId } from '../utils/validators.js';
import { uploadFile, generateFilePath } from '../config/storage.js';
import { buildStudentCohortQuery } from './cohort.service.js';

const findTeacher = async (userId) => {
  const teacher = await Teacher.findOne({ userId });

  if (!teacher) {
    throw new AppError('Teacher profile not found', 404);
  }

  return teacher;
};

const assertAssigned = async (teacher, teacherCourseId) => {
  if (!isValidObjectId(teacherCourseId)) {
    throw new AppError('Invalid course assignment ID', 400);
  }

  const teacherCourse = await TeacherCourse.findOne({
    _id: teacherCourseId,
    teacher: teacher._id,
    isActive: true,
  });

  if (!teacherCourse) {
    throw new AppError('You are not assigned to this course', 403);
  }

  return teacherCourse;
};

export const resolveCourseByCode = async (courseCode) => {
  if (!courseCode) {
    return null;
  }

  const course = await Course.findOne({ code: courseCode })
    .select('_id')
    .lean();

  return course?._id || null;
};

export const uploadCourseMaterial = async (user, payload, file) => {
  const teacher = await findTeacher(user._id);
  const { teacherCourseId, title, description, type, externalLink } = payload;

  if (!teacherCourseId) {
    throw new AppError('Course assignment is required', 400);
  }

  if (!title || !type) {
    throw new AppError('Title and type are required', 400);
  }

  const teacherCourse = await assertAssigned(teacher, teacherCourseId);
  const course = await resolveCourseByCode(teacherCourse.courseCode);

  let filePath = null;
  let fileName = null;
  let fileSize = null;

  if (file) {
    const path = generateFilePath(user._id.toString(), file.originalname);
    const result = await uploadFile(path, file.buffer, file.mimetype);
    const storagePath = result?.path || path;

    await File.create({
      originalFileName: file.originalname,
      storagePath,
      contentType: file.mimetype,
      size: result?.size ?? file.size,
      uploadedBy: user._id,
      relatedModel: 'CourseMaterial',
    });

    filePath = storagePath;
    fileName = file.originalname;
    fileSize = result?.size ?? file.size;
  }

  return CourseMaterial.create({
    teacherCourseId,
    course,
    teacher: teacher._id,
    title,
    description,
    type,
    filePath,
    fileName,
    fileSize,
    externalLink,
    isPublished: true,
    uploadedBy: user._id,
  });
};

export const createAssignment = async (user, payload) => {
  const teacher = await findTeacher(user._id);
  const {
    teacherCourseId,
    title,
    description,
    instructions,
    maxMarks,
    dueDate,
    isPublished,
  } = payload;

  if (!teacherCourseId) {
    throw new AppError('Course assignment is required', 400);
  }

  if (!title || maxMarks === undefined || !dueDate) {
    throw new AppError('Title, max marks and due date are required', 400);
  }

  const teacherCourse = await assertAssigned(teacher, teacherCourseId);
  const course = await resolveCourseByCode(teacherCourse.courseCode);

  return Assignment.create({
    teacherCourseId,
    course,
    teacher: teacher._id,
    title,
    description,
    instructions,
    maxMarks: Number(maxMarks) || 0,
    dueDate,
    isPublished: Boolean(isPublished),
    createdBy: user._id,
  });
};

export const getAssignmentSubmissions = async (user, assignmentId) => {
  const teacher = await findTeacher(user._id);

  const assignment = await Assignment.findById(assignmentId);

  if (!assignment) {
    throw new AppError('Assignment not found', 404);
  }

  if (assignment.teacher.toString() !== teacher._id.toString()) {
    throw new AppError('Access denied', 403);
  }

  return Submission.find({ assignment: assignmentId })
    .populate('student')
    .populate('submittedBy')
    .sort({ submittedAt: -1 });
};

export const gradeSubmission = async (user, submissionId, payload) => {
  const teacher = await findTeacher(user._id);

  const submission =
    await Submission.findById(submissionId).populate('assignment');

  if (!submission) {
    throw new AppError('Submission not found', 404);
  }

  if (submission.assignment.teacher.toString() !== teacher._id.toString()) {
    throw new AppError('Access denied', 403);
  }

  submission.marks = payload.marks;
  submission.feedback = payload.feedback;
  submission.status = 'graded';
  submission.gradedBy = user._id;
  submission.gradedAt = new Date();
  await submission.save();

  return submission;
};

export const resolveStudentTeacherCourseIds = async (student) => {
  if (!student) {
    return [];
  }

  const cohortQuery = buildStudentCohortQuery(student);

  if (!cohortQuery) {
    return [];
  }

  const courses = await TeacherCourse.find({
    status: 'active',
    ...cohortQuery,
  })
    .select('_id')
    .lean();

  return courses.map((course) => course._id);
};

export const attachCourseView = (doc) => {
  if (!doc) {
    return doc;
  }

  const obj = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  const teacherCourse = obj.teacherCourseId;

  if (teacherCourse && teacherCourse.courseName) {
    obj.course = {
      _id: teacherCourse._id,
      title: teacherCourse.courseName,
      code: teacherCourse.courseCode,
      shortName: teacherCourse.shortName,
      section: teacherCourse.section,
      semester: teacherCourse.semester,
    };
  }

  return obj;
};

export const listMaterialsForStudent = async (user, filters = {}) => {
  const student = await Student.findOne({ userId: user._id });

  if (!student) {
    return [];
  }

  const teacherCourseIds = await resolveStudentTeacherCourseIds(student);

  const query = {
    teacherCourseId: { $in: teacherCourseIds },
    isPublished: true,
  };

  if (filters.teacherCourseId) {
    query.teacherCourseId = filters.teacherCourseId;
  }

  const materials = await CourseMaterial.find(query)
    .populate('teacherCourseId')
    .populate('teacher')
    .sort({ createdAt: -1 });

  return materials.map(attachCourseView);
};

export const listAssignmentsForStudent = async (
  user,
  { upcomingOnly = false, limit = 0 } = {},
) => {
  const student = await Student.findOne({ userId: user._id });

  if (!student) {
    return [];
  }

  const teacherCourseIds = await resolveStudentTeacherCourseIds(student);

  const query = {
    teacherCourseId: { $in: teacherCourseIds },
    isPublished: true,
  };

  if (upcomingOnly) {
    query.dueDate = { $gte: new Date() };
  }

  const assignmentQuery = Assignment.find(query)
    .populate('teacherCourseId')
    .populate('teacher')
    .sort({ dueDate: upcomingOnly ? 1 : -1 });

  if (limit > 0) {
    assignmentQuery.limit(limit);
  }

  const assignments = await assignmentQuery;
  const submissions = await Submission.find({ student: student._id });
  const submissionMap = new Map(
    submissions.map((sub) => [sub.assignment.toString(), sub]),
  );

  return assignments.map((assignment) => ({
    ...attachCourseView(assignment),
    submission: submissionMap.get(assignment._id.toString()) || null,
  }));
};

export default {
  uploadCourseMaterial,
  createAssignment,
  getAssignmentSubmissions,
  gradeSubmission,
  resolveStudentTeacherCourseIds,
  resolveCourseByCode,
  attachCourseView,
  listMaterialsForStudent,
  listAssignmentsForStudent,
};
