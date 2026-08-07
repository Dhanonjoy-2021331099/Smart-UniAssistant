import path from 'path';
import Result, { RESULT_TYPES, RESULT_TYPE_LABELS } from '../models/Result.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import TeacherCourse from '../models/TeacherCourse.js';
import Course from '../models/Course.js';
import User from '../models/User.js';
import File from '../models/File.js';
import AppError from '../utils/AppError.js';
import {
  uploadFile,
  downloadFile,
  deleteFile,
  generateFilePath,
  getUploadUrl,
} from '../config/storage.js';
import { createResultNotifications } from './notification.service.js';
import {
  resolveDepartmentCode,
  matchCohort,
  studentMatchesResultCohort,
  buildStudentCohortQuery,
} from './cohort.service.js';

export { RESULT_TYPES, RESULT_TYPE_LABELS };

const computeGrade = (percentage) => {
  if (percentage >= 90) return { letterGrade: 'A+', gradePoint: 4.0 };
  if (percentage >= 85) return { letterGrade: 'A', gradePoint: 3.75 };
  if (percentage >= 80) return { letterGrade: 'A-', gradePoint: 3.5 };
  if (percentage >= 75) return { letterGrade: 'B+', gradePoint: 3.25 };
  if (percentage >= 70) return { letterGrade: 'B', gradePoint: 3.0 };
  if (percentage >= 65) return { letterGrade: 'B-', gradePoint: 2.75 };
  if (percentage >= 60) return { letterGrade: 'C+', gradePoint: 2.5 };
  if (percentage >= 55) return { letterGrade: 'C', gradePoint: 2.25 };
  if (percentage >= 50) return { letterGrade: 'D', gradePoint: 2.0 };
  return { letterGrade: 'F', gradePoint: 0.0 };
};

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const pad = (value) => String(value).padStart(2, '0');

export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

export const formatTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  let hours = d.getHours();
  const minutes = pad(d.getMinutes());
  const suffix = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${pad(hours)}:${minutes} ${suffix}`;
};

const findTeacher = async (userId) => {
  const teacher = await Teacher.findOne({ userId });

  if (!teacher) {
    throw new AppError('Teacher profile not found', 404);
  }

  return teacher;
};

const assertAssigned = async (teacher, teacherCourseId) => {
  const assignment = await TeacherCourse.findOne({
    _id: teacherCourseId,
    teacher: teacher._id,
    isActive: true,
  });

  if (!assignment) {
    throw new AppError('You are not assigned to this course', 403);
  }

  return assignment;
};

const resolveTeacherName = async (teacher) => {
  const teacherUser = await User.findById(teacher.userId)
    .select('name')
    .lean();

  return teacherUser?.name || teacher.teacherId;
};

const resolveUserNames = async (users) => {
  const userIds = [
    ...new Set(users.map((u) => u.userId?.toString()).filter(Boolean)),
  ];
  const found = await User.find({ _id: { $in: userIds } })
    .select('_id name')
    .lean();
  const nameMap = new Map(found.map((u) => [u._id.toString(), u.name]));
  const userCache = new Map();

  users.forEach((user) => {
    const key = user.userId?.toString();
    userCache.set(key, nameMap.get(key) || '');
  });

  return userCache;
};

const resolveEnrolledStudents = async (assignment) => {
  const assignmentCode = resolveDepartmentCode(assignment.department);
  const students = await Student.find()
    .select('_id studentId userId department semester section academicSession session')
    .lean();

  return students.filter(
    (student) => matchCohort(assignment, student, assignmentCode).ok,
  );
};

const resolveCourseByCode = async (courseCode) => {
  if (!courseCode) {
    return null;
  }

  const course = await Course.findOne({ code: courseCode })
    .select('_id')
    .lean();

  return course?._id || null;
};

const buildResultUpdate = async ({
  teacher,
  teacherName,
  assignment,
  student,
  studentName,
  user,
  data,
  file,
}) => {
  const marks = Number(data.marks) || 0;
  const maxMarks = Number(data.maxMarks) || 0;
  const percentage = maxMarks > 0 ? (marks / maxMarks) * 100 : 0;
  const grade = computeGrade(percentage);
  const isFinal =
    data.resultType === 'final';
  const departmentCode =
    resolveDepartmentCode(assignment.department) ||
    String(assignment.department || '');
  const course = await resolveCourseByCode(assignment.courseCode);

  return {
    student: student._id,
    teacherCourseId: assignment._id,
    course,
    department: departmentCode,
    departmentName: assignment.departmentName || assignment.department || '',
    semester: String(assignment.semester || ''),
    section: String(assignment.section || ''),
    courseType: String(assignment.courseType || ''),
    academicSession: String(assignment.academicSession || ''),
    resultType: data.resultType,
    courseCode: assignment.courseCode || '',
    courseName: assignment.courseName || '',
    shortName: assignment.shortName || '',
    teacherId: teacher._id,
    teacherName,
    studentId: student.studentId,
    studentName,
    marks,
    maxMarks,
    remarks: data.remarks || '',
    totalMarks: marks,
    letterGrade: isFinal ? grade.letterGrade : null,
    gradePoint: isFinal ? grade.gradePoint : null,
    status: 'draft',
    isPublished: false,
    ...(file
      ? {
          fileUrl: file.path,
          fileName: file.name,
          fileSize: file.size,
        }
      : {}),
    createdBy: user._id,
    updatedAt: new Date(),
  };
};

const pushResultVersion = (result, user, userNames, overrides = {}) => {
  const now = new Date();
  const nextVersion = (result.versions?.length || 0) + 1;

  const entry = {
    version: nextVersion,
    marks: result.marks,
    maxMarks: result.maxMarks,
    remarks: result.remarks,
    status: result.isPublished ? 'published' : 'draft',
    fileUrl: result.fileUrl,
    fileName: result.fileName,
    updatedBy: user._id,
    updatedByName: userNames || '',
    updatedDate: formatDate(now),
    updatedTime: formatTime(now),
    replacedAt: now,
    ...overrides,
  };

  if (!result.versions) {
    result.versions = [];
  }

  result.versions.push(entry);

  return entry;
};

const upsertCourseResults = async ({
  teacher,
  teacherName,
  user,
  assignment,
  resultType,
  entries = [],
  file = null,
}) => {
  const assignmentCode = resolveDepartmentCode(assignment.department);
  const hasEntries = entries.length > 0;
  const targets = [];
  const errors = [];
  const seen = new Set();

  if (hasEntries) {
    for (const entry of entries) {
      const studentId = String(entry.studentId || '').trim();

      if (!studentId) {
        errors.push({ studentId: '', error: 'Student ID is required' });
        continue;
      }

      const student = await Student.findOne({ studentId }).lean();

      if (!student) {
        errors.push({
          studentId,
          error: `Student ID ${studentId} not found`,
        });
        continue;
      }

      const cohort = matchCohort(assignment, student, assignmentCode);

      if (!cohort.ok) {
        errors.push({ studentId, error: cohort.reason });
        continue;
      }

      const key = student._id.toString();

      if (seen.has(key)) continue;
      seen.add(key);

      targets.push({ entry, student });
    }
  } else {
    const enrolled = await resolveEnrolledStudents(assignment);

    for (const student of enrolled) {
      const key = student._id.toString();

      if (seen.has(key)) continue;
      seen.add(key);

      targets.push({ entry: null, student });
    }
  }

  const userCache = await resolveUserNames(targets.map((t) => t.student));

  const publishedByStudent = new Map(
    (
      await Result.find({
        student: { $in: targets.map((t) => t.student._id) },
        teacherCourseId: assignment._id,
        resultType,
      })
        .select('student isPublished')
        .lean()
    )
      .filter((result) => result.isPublished)
      .map((result) => [result.student.toString(), result]),
  );

  const created = [];

  for (const { entry, student } of targets) {
    const studentName = userCache.get(student.userId?.toString()) || '';

    const update = await buildResultUpdate({
      teacher,
      teacherName,
      assignment,
      student,
      studentName,
      user,
      data: { ...(entry || {}), resultType },
      file,
    });

    if (publishedByStudent.has(student._id.toString())) {
      update.status = 'published';
      update.isPublished = true;
    }

    const result = await Result.findOneAndUpdate(
      {
        student: student._id,
        teacherCourseId: assignment._id,
        resultType,
      },
      update,
      { returnDocument: 'after', upsert: true },
    );

    created.push(result);
  }

  return { created, errors };
};

export const listTeacherResults = async (user, filters = {}) => {
  const teacher = await findTeacher(user._id);

  const query = {
    teacherId: teacher._id,
    isArchived: { $ne: true },
  };

  if (filters.teacherCourseId) query.teacherCourseId = filters.teacherCourseId;
  else if (filters.courseId) query.course = filters.courseId;
  if (filters.semester) query.semester = String(filters.semester);
  if (filters.courseCode) query.courseCode = String(filters.courseCode);
  if (filters.academicSession) query.academicSession = String(filters.academicSession);
  if (filters.resultType) query.resultType = filters.resultType;
  if (filters.status) query.status = filters.status;

  if (filters.publishedDate) {
    const dayStart = new Date(`${filters.publishedDate}T00:00:00`);
    const dayEnd = new Date(`${filters.publishedDate}T23:59:59.999`);

    if (!Number.isNaN(dayStart.getTime()) && !Number.isNaN(dayEnd.getTime())) {
      query.publishDate = { $gte: dayStart, $lte: dayEnd };
    }
  }

  if (filters.search) {
    const term = filters.search.trim();
    query.$or = [
      { studentId: { $regex: term, $options: 'i' } },
      { studentName: { $regex: term, $options: 'i' } },
      { courseCode: { $regex: term, $options: 'i' } },
      { courseName: { $regex: term, $options: 'i' } },
      { shortName: { $regex: term, $options: 'i' } },
    ];
  }

  const page = Math.max(parseInt(filters.page, 10) || 1, 1);
  const limit = Math.min(
    Math.max(parseInt(filters.limit, 10) || 50, 1),
    200,
  );
  const skip = (page - 1) * limit;

  const [results, total] = await Promise.all([
    Result.find(query)
      .sort({ updatedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Result.countDocuments(query),
  ]);

  return { results, total, page, limit };
};

export const createOrUpdateResult = async (user, payload) => {
  const teacher = await findTeacher(user._id);
  const { teacherCourseId, studentId } = payload;
  const resultType = payload.resultType || 'final';

  if (!teacherCourseId || !studentId) {
    throw new AppError('Course and student are required', 400);
  }

  const assignment = await assertAssigned(teacher, teacherCourseId);

  const normalizedStudentId = String(studentId).trim();
  const student = await Student.findOne({ studentId: normalizedStudentId }).lean();

  if (!student) {
    throw new AppError(`Student ID ${normalizedStudentId} not found`, 404);
  }

  const cohort = matchCohort(
    assignment,
    student,
    resolveDepartmentCode(assignment.department),
  );

  if (!cohort.ok) {
    throw new AppError(cohort.reason, 400);
  }

  const userCache = await resolveUserNames([student]);
  const studentName = userCache.get(student.userId?.toString()) || '';
  const teacherName = await resolveTeacherName(teacher);

  const update = await buildResultUpdate({
    teacher,
    teacherName,
    assignment,
    student,
    studentName,
    user,
    data: { ...payload, resultType },
    file: payload.file,
  });

  const existing = await Result.findOne({
    student: student._id,
    teacherCourseId: assignment._id,
    resultType,
  })
    .select('isPublished')
    .lean();

  if (existing?.isPublished) {
    update.status = 'published';
    update.isPublished = true;
  }

  return Result.findOneAndUpdate(
    {
      student: student._id,
      teacherCourseId: assignment._id,
      resultType,
    },
    update,
    { returnDocument: 'after', upsert: true },
  );
};

export const bulkCreateResults = async (user, payload) => {
  const { teacherCourseId, resultType, entries, file } = payload;

  if (!teacherCourseId) {
    throw new AppError('Course is required', 400);
  }

  if ((!entries || entries.length === 0) && !file) {
    throw new AppError('Add at least one entry or upload a file', 400);
  }

  const teacher = await findTeacher(user._id);
  const assignment = await assertAssigned(teacher, teacherCourseId);
  const teacherName = await resolveTeacherName(teacher);

  return upsertCourseResults({
    teacher,
    teacherName,
    user,
    assignment,
    resultType: resultType || 'final',
    entries: Array.isArray(entries) ? entries : [],
    file: file || null,
  });
};

const parseCsv = (content) => {
  const delimiter = content.includes(';') ? ';' : ',';
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);

  if (lines.length === 0) return [];

  const parseRow = (row) => {
    const cells = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < row.length; i += 1) {
      const ch = row[i];

      if (inQuotes) {
        if (ch === '"') {
          if (row[i + 1] === '"') {
            current += '"';
            i += 1;
          } else {
            inQuotes = false;
          }
        } else {
          current += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === delimiter) {
        cells.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }

    cells.push(current.trim());
    return cells;
  };

  const parsed = lines.map(parseRow);
  const headerIndex = parsed.findIndex((row) =>
    row.some((cell) => /student|id|roll|marks/i.test(cell)),
  );
  const start = headerIndex >= 0 ? headerIndex + 1 : 0;

  return parsed
    .slice(start)
    .map((row) => {
      const studentId = row[0] || '';
      const marks = row.length > 1 ? Number(row[1]) : NaN;
      const maxMarks = row.length > 2 && row[2] !== '' ? Number(row[2]) : NaN;
      const remarks = row.length > 3 ? row[3] : '';

      return {
        studentId,
        marks: Number.isFinite(marks) ? marks : 0,
        maxMarks: Number.isFinite(maxMarks) ? maxMarks : 0,
        remarks: String(remarks || ''),
      };
    })
    .filter((entry) => entry.studentId);
};

export const uploadResultFile = async (user, payload, file) => {
  if (!file) {
    throw new AppError('No file provided', 400);
  }

  const teacher = await findTeacher(user._id);
  const { teacherCourseId } = payload;

  if (!teacherCourseId) {
    throw new AppError('Course is required', 400);
  }

  await assertAssigned(teacher, teacherCourseId);

  const ext = path.extname(file.originalname).toLowerCase();
  const supported = ['.pdf', '.csv', '.xlsx', '.xls'];

  if (!supported.includes(ext)) {
    throw new AppError(
      'Unsupported file type. Allowed: PDF, CSV, XLSX, XLS',
      400,
    );
  }

  const relPath = generateFilePath(user._id.toString(), file.originalname);
  const uploaded = await uploadFile(relPath, file.buffer, file.mimetype);
  const storagePath = uploaded?.path || relPath;

  await File.create({
    originalFileName: file.originalname,
    storagePath,
    contentType: file.mimetype,
    size: file.size,
    uploadedBy: user._id,
    relatedModel: 'Result',
  });

  let preview = null;

  if (ext === '.csv') {
    preview = parseCsv(file.buffer.toString('utf8'));
  }

  return {
    fileUrl: storagePath,
    publicUrl: getUploadUrl(uploaded, relPath),
    fileName: file.originalname,
    fileSize: file.size,
    preview,
    requiresManualEntry: ext !== '.csv',
  };
};

export const uploadComponentResults = async (user, payload) => {
  const { teacherCourseId, semester, results } = payload;

  if (!teacherCourseId) {
    throw new AppError('Course assignment is required', 400);
  }

  const teacher = await findTeacher(user._id);
  const assignment = await assertAssigned(teacher, teacherCourseId);
  const teacherName = await resolveTeacherName(teacher);

  const entries = Array.isArray(results) ? results : [];
  const savedResults = [];
  const errors = [];
  const seen = new Set();

  for (const data of entries) {
    const studentId = String(data.studentId || '').trim();

    if (!studentId) {
      errors.push({ studentId: '', error: 'Student ID is required' });
      continue;
    }

    const student = await Student.findOne({ studentId }).lean();

    if (!student) {
      errors.push({
        studentId,
        error: `Student ID ${studentId} not found`,
      });
      continue;
    }

    const cohort = matchCohort(
      assignment,
      student,
      resolveDepartmentCode(assignment.department),
    );

    if (!cohort.ok) {
      errors.push({ studentId, error: cohort.reason });
      continue;
    }

    const key = student._id.toString();

    if (seen.has(key)) continue;
    seen.add(key);

    const existing = await Result.findOne({
      student: student._id,
      teacherCourseId: assignment._id,
      resultType: 'final',
    })
      .select('isPublished')
      .lean();

    const quizMarks = Number(data.quizMarks) || 0;
    const assignmentMarks = Number(data.assignmentMarks) || 0;
    const labMarks = Number(data.labMarks) || 0;
    const midMarks = Number(data.midMarks) || 0;
    const finalMarks = Number(data.finalMarks) || 0;
    const totalMarks =
      quizMarks + assignmentMarks + labMarks + midMarks + finalMarks;
    const { letterGrade, gradePoint } = computeGrade(totalMarks);

    const result = await Result.findOneAndUpdate(
      {
        student: student._id,
        teacherCourseId: assignment._id,
        resultType: 'final',
      },
      {
        student: student._id,
        teacherCourseId: assignment._id,
        department:
          resolveDepartmentCode(assignment.department) ||
          String(assignment.department || ''),
        departmentName: assignment.departmentName || assignment.department || '',
        semester: String(assignment.semester || semester || ''),
        section: String(assignment.section || ''),
        courseType: String(assignment.courseType || ''),
        academicSession: String(assignment.academicSession || ''),
        resultType: 'final',
        courseCode: assignment.courseCode || '',
        courseName: assignment.courseName || '',
        shortName: assignment.shortName || '',
        teacherId: teacher._id,
        teacherName,
        studentId: student.studentId,
        quizMarks,
        assignmentMarks,
        labMarks,
        midMarks,
        finalMarks,
        marks: totalMarks,
        maxMarks: 100,
        totalMarks,
        letterGrade,
        gradePoint,
        ...(existing?.isPublished
          ? { status: 'published', isPublished: true }
          : { status: 'draft', isPublished: false }),
        createdBy: user._id,
        updatedAt: new Date(),
      },
      { returnDocument: 'after', upsert: true },
    );

    savedResults.push(result);
  }

  return { savedResults, errors };
};

const buildPublishInfo = (result, teacherName) => {
  const now = new Date();

  return {
    publishedDate: result.publishInfo?.publishedDate || formatDate(now),
    publishedTime: result.publishInfo?.publishedTime || formatTime(now),
    teacherName: teacherName || result.teacherName || '',
    course: result.courseName || '',
    shortName: result.shortName || '',
    semester: result.semester || '',
    department: result.department || '',
    departmentName: result.departmentName || result.department || '',
    courseCode: result.courseCode || '',
    resultType: result.resultType || '',
    section: result.section || '',
    academicSession: result.academicSession || '',
    updatedDate: formatDate(now),
    updatedTime: formatTime(now),
    updatedByName: teacherName || result.teacherName || '',
    updatedAt: now,
  };
};

const markPublished = async (result, user, teacherName) => {
  const now = new Date();
  const firstPublish = !result.publishedAt;

  result.publishInfo = buildPublishInfo(result, teacherName);
  result.status = 'published';
  result.isPublished = true;
  result.publishDate = now;
  result.publishedBy = user._id;
  result.publishInfo.updatedByName = teacherName || '';

  if (firstPublish) {
    result.publishedAt = now;
    if (!result.versions || result.versions.length === 0) {
      pushResultVersion(result, user, teacherName, {
        reason: 'Initial publish',
      });
    }
  }

  result.lastUpdatedAt = now;
  result.updatedAt = now;
  await result.save();

  await createResultNotifications(result, { isUpdate: !firstPublish });

  return result;
};

const refreshPublishedState = (result, user, teacherName) => {
  if (result.isPublished) {
    const now = new Date();

    result.publishInfo = {
      ...(result.publishInfo || {}),
      publishedDate: result.publishInfo?.publishedDate || formatDate(now),
      publishedTime: result.publishInfo?.publishedTime || formatTime(now),
      updatedDate: formatDate(now),
      updatedTime: formatTime(now),
      updatedByName: teacherName || result.publishInfo?.updatedByName || '',
      updatedAt: now,
    };
    result.status = 'published';
    result.isPublished = true;
    result.publishDate = now;
    result.publishedAt = result.publishedAt || now;
  } else {
    result.status = 'draft';
    result.isPublished = false;
  }

  return result;
};

export const publishUploadedResults = async (user, payload) => {
  const { teacherCourseId, resultType, entries, file } = payload;

  if (!teacherCourseId) {
    throw new AppError('Course is required', 400);
  }

  if ((!entries || entries.length === 0) && !file) {
    throw new AppError('Add at least one entry or upload a file to publish', 400);
  }

  const teacher = await findTeacher(user._id);
  const assignment = await assertAssigned(teacher, teacherCourseId);
  const teacherName = await resolveTeacherName(teacher);

  const { created, errors } = await upsertCourseResults({
    teacher,
    teacherName,
    user,
    assignment,
    resultType: resultType || 'final',
    entries: Array.isArray(entries) ? entries : [],
    file: file || null,
  });

  if (created.length === 0 && errors.length > 0) {
    throw new AppError(
      `No results were created. ${errors.map((e) => e.error).join(' ')}`,
      400,
    );
  }

  if (created.length === 0) {
    throw new AppError(
      'No results were created. No students matched the selected course cohort.',
      400,
    );
  }

  const published = [];

  for (const result of created) {
    await markPublished(result, user, teacherName);
    published.push(result);
  }

  return { published: published.length, errors };
};

export const publishResultPdf = async (user, payload, file) => {
  const { teacherCourseId, resultType, reason } = payload;

  if (!teacherCourseId) {
    throw new AppError('Course is required', 400);
  }

  if (!resultType) {
    throw new AppError('Result type is required', 400);
  }

  if (!file) {
    throw new AppError('A PDF file is required to publish', 400);
  }

  const ext = path.extname(file.originalname).toLowerCase();

  if (ext !== '.pdf') {
    throw new AppError('Only PDF files can be published', 400);
  }

  const teacher = await findTeacher(user._id);
  const assignment = await assertAssigned(teacher, teacherCourseId);
  const teacherName = await resolveTeacherName(teacher);

  const relPath = generateFilePath(user._id.toString(), file.originalname);
  const uploaded = await uploadFile(relPath, file.buffer, file.mimetype);
  const storagePath = uploaded?.path || relPath;

  await File.create({
    originalFileName: file.originalname,
    storagePath,
    contentType: file.mimetype,
    size: file.size,
    uploadedBy: user._id,
    relatedModel: 'Result',
  });

  const departmentCode =
    resolveDepartmentCode(assignment.department) ||
    String(assignment.department || '');

  const base = {
    teacherCourseId: assignment._id,
    department: departmentCode,
    departmentName: assignment.departmentName || assignment.department || '',
    semester: String(assignment.semester || ''),
    section: String(assignment.section || ''),
    courseType: String(assignment.courseType || ''),
    academicSession: String(assignment.academicSession || ''),
    resultType,
    courseCode: assignment.courseCode || '',
    courseName: assignment.courseName || '',
    shortName: assignment.shortName || '',
    teacherId: teacher._id,
    teacherName,
    fileUrl: storagePath,
    fileName: file.originalname,
    fileSize: file.size,
  };

  const existing = await Result.findOne({
    student: null,
    teacherCourseId: assignment._id,
    resultType,
  });

  let result;
  let previousPDF = '';

  if (existing) {
    const wasPublished = existing.isPublished;
    previousPDF = existing.fileUrl || '';

    pushResultVersion(existing, user, teacherName, {
      reason: reason || '',
      previousPDF,
      currentPDF: storagePath,
      status: wasPublished ? 'published' : 'draft',
    });

    Object.assign(existing, base);
    existing.updatedAt = new Date();
    result = existing;
  } else {
    result = new Result({
      ...base,
      status: 'draft',
      isPublished: false,
      createdBy: user._id,
    });
  }

  await markPublished(result, user, teacherName);

  if (previousPDF) {
    try {
      await deleteFile(previousPDF);
    } catch (error) {
      console.warn('Could not delete previous result PDF:', error.message);
    }
  }

  return result;
};

export const publishResult = async (user, resultId) => {
  const teacher = await findTeacher(user._id);
  const result = await Result.findById(resultId);

  if (!result) throw new AppError('Result not found', 404);
  if (result.teacherId?.toString() !== teacher._id.toString()) {
    throw new AppError('Access denied', 403);
  }
  if (result.isArchived) {
    throw new AppError('Archived results cannot be published', 400);
  }

  const teacherName = await resolveTeacherName(teacher);

  return markPublished(result, user, teacherName);
};

export const bulkPublishResults = async (user, resultIds) => {
  if (!Array.isArray(resultIds) || resultIds.length === 0) {
    throw new AppError('No results selected', 400);
  }

  const teacher = await findTeacher(user._id);
  const results = await Result.find({
    _id: { $in: resultIds },
    teacherId: teacher._id,
    isArchived: { $ne: true },
  });

  const teacherName = await resolveTeacherName(teacher);

  for (const result of results) {
    await markPublished(result, user, teacherName);
  }

  return { published: results.length };
};

export const replaceResult = async (user, resultId, payload) => {
  const teacher = await findTeacher(user._id);
  const result = await Result.findById(resultId);

  if (!result) throw new AppError('Result not found', 404);
  if (result.teacherId?.toString() !== teacher._id.toString()) {
    throw new AppError('Access denied', 403);
  }

  const { marks, maxMarks, remarks, reason } = payload;

  if (marks === undefined && maxMarks === undefined && remarks === undefined) {
    throw new AppError('Nothing to replace', 400);
  }

  const userNames = await resolveUserNames([{ userId: user._id }]);
  const teacherName = userNames.get(String(user._id)) || '';
  const wasPublished = result.isPublished;

  pushResultVersion(result, user, teacherName, {
    reason: reason || '',
    status: wasPublished ? 'published' : 'draft',
  });

  if (marks !== undefined) result.marks = Number(marks) || 0;
  if (maxMarks !== undefined) result.maxMarks = Number(maxMarks) || 0;
  if (remarks !== undefined) result.remarks = remarks;
  result.totalMarks = result.marks;

  if (result.resultType === 'final') {
    const percentage =
      result.maxMarks > 0 ? (result.marks / result.maxMarks) * 100 : 0;
    const grade = computeGrade(percentage);
    result.letterGrade = grade.letterGrade;
    result.gradePoint = grade.gradePoint;
  }

  refreshPublishedState(result, user, teacherName);
  result.lastUpdatedAt = new Date();
  result.updatedAt = new Date();
  await result.save();

  if (wasPublished) {
    await createResultNotifications(result, { isUpdate: true });
  }

  return result;
};

export const replaceResultFile = async (user, resultId, payload) => {
  const teacher = await findTeacher(user._id);
  const result = await Result.findById(resultId);

  if (!result) throw new AppError('Result not found', 404);
  if (result.teacherId?.toString() !== teacher._id.toString()) {
    throw new AppError('Access denied', 403);
  }

  const { file, reason } = payload;

  if (!file) {
    throw new AppError('No PDF file provided', 400);
  }

  const ext = path.extname(file.originalname).toLowerCase();

  if (ext !== '.pdf') {
    throw new AppError('Only PDF files can replace a result file', 400);
  }

  const relPath = generateFilePath(user._id.toString(), file.originalname);
  const uploaded = await uploadFile(relPath, file.buffer, file.mimetype);
  const storagePath = uploaded?.path || relPath;

  await File.create({
    originalFileName: file.originalname,
    storagePath,
    contentType: file.mimetype,
    size: file.size,
    uploadedBy: user._id,
    relatedModel: 'Result',
    relatedId: result._id,
  });

  const previousPDF = result.fileUrl || '';
  const now = new Date();
  const userNames = await resolveUserNames([{ userId: user._id }]);
  const teacherName = userNames.get(String(user._id)) || '';
  const wasPublished = result.isPublished;

  pushResultVersion(result, user, teacherName, {
    reason: reason || '',
    previousPDF,
    currentPDF: storagePath,
    status: wasPublished ? 'published' : 'draft',
  });

  result.fileUrl = storagePath;
  result.fileName = file.originalname;
  result.fileSize = file.size;
  refreshPublishedState(result, user, teacherName);
  result.lastUpdatedAt = now;
  result.updatedAt = now;
  await result.save();

  if (wasPublished) {
    await createResultNotifications(result, { isUpdate: true });
  }

  if (previousPDF) {
    try {
      await deleteFile(previousPDF);
    } catch (error) {
      console.warn('Could not delete previous result PDF:', error.message);
    }
  }

  return result;
};

export const getResultVersions = async (user, resultId) => {
  const teacher = await findTeacher(user._id);
  const result = await Result.findById(resultId).lean();

  if (!result) throw new AppError('Result not found', 404);
  if (result.teacherId?.toString() !== teacher._id.toString()) {
    throw new AppError('Access denied', 403);
  }

  const versions = Array.isArray(result.versions) ? result.versions : [];

  return versions.sort((a, b) => (a.version || 0) - (b.version || 0));
};

export const archiveResult = async (user, resultId) => {
  const teacher = await findTeacher(user._id);
  const result = await Result.findById(resultId);

  if (!result) throw new AppError('Result not found', 404);
  if (result.teacherId?.toString() !== teacher._id.toString()) {
    throw new AppError('Access denied', 403);
  }

  result.isArchived = true;
  result.status = 'archived';
  result.updatedAt = new Date();
  await result.save();

  return result;
};

export const permanentlyDeleteResult = async (user, resultId) => {
  const teacher = await findTeacher(user._id);
  const result = await Result.findById(resultId);

  if (!result) throw new AppError('Result not found', 404);
  if (result.teacherId?.toString() !== teacher._id.toString()) {
    throw new AppError('Access denied', 403);
  }

  await Result.findByIdAndDelete(resultId);
  return true;
};

export const getStudentResults = async (user, filters = {}) => {
  const student = await Student.findOne({ userId: user._id });

  if (!student) {
    return [];
  }

  const studentId = student._id.toString();
  const baseFilter = {
    isPublished: true,
    status: 'published',
    isArchived: { $ne: true },
  };

  const ownResults = await Result.find({
    ...baseFilter,
    student: studentId,
  }).lean();

  let cohortResults = [];

  const cohortQuery = buildStudentCohortQuery(student);

  if (cohortQuery) {
    const matchedCourses = await TeacherCourse.find(cohortQuery)
      .select('courseCode')
      .lean();
    const courseCodes = [
      ...new Set(matchedCourses.map((course) => course.courseCode).filter(Boolean)),
    ];

    if (courseCodes.length > 0) {
      cohortResults = await Result.find({
        ...baseFilter,
        department: cohortQuery.department,
        semester: cohortQuery.semester,
        academicSession: cohortQuery.academicSession,
        courseCode: { $in: courseCodes },
      }).lean();
    }
  }

  const groupKey = (result) =>
    result.teacherCourseId
      ? `tc:${result.teacherCourseId.toString()}:${result.resultType}`
      : `code:${result.courseCode || ''}:${result.resultType}:${result.section || ''}`;

  const grouped = new Map();

  for (const result of [...ownResults, ...cohortResults]) {
    const key = groupKey(result);
    const existing = grouped.get(key);
    const isOwn = result.student?.toString() === studentId;

    if (!existing) {
      grouped.set(key, { result, isOwn });
    } else if (isOwn && !existing.isOwn) {
      grouped.set(key, { result, isOwn });
    }
  }

  let filtered = Array.from(grouped.values(), (entry) => entry.result);

  if (filters.teacherCourseId) {
    const tcId = String(filters.teacherCourseId);
    filtered = filtered.filter(
      (result) => result.teacherCourseId?.toString() === tcId,
    );
  }

  if (filters.courseId) {
    const courseId = String(filters.courseId);
    filtered = filtered.filter((result) => result.course?.toString() === courseId);
  }

  if (filters.resultType) {
    filtered = filtered.filter((result) => result.resultType === filters.resultType);
  }

  if (filters.semester) {
    const semester = String(filters.semester);
    filtered = filtered.filter((result) => String(result.semester) === semester);
  }

  if (filters.academicSession) {
    filtered = filtered.filter(
      (result) => result.academicSession === filters.academicSession,
    );
  }

  if (filters.courseCode) {
    const code = String(filters.courseCode).trim().toUpperCase();
    filtered = filtered.filter(
      (result) => String(result.courseCode || '').toUpperCase() === code,
    );
  }

  const search = String(filters.search || '').trim().toUpperCase();

  if (search) {
    filtered = filtered.filter((result) =>
      [result.courseCode, result.courseName, result.shortName, result.semester, result.teacherName]
        .some((value) => String(value || '').toUpperCase().includes(search)),
    );
  }

  const bestResults = filtered.map((result) => {
    if (result.student?.toString() !== studentId) {
      delete result.marks;
    }

    return result;
  });

  return bestResults.sort((a, b) => {
    const aTime = new Date(a.publishDate || a.publishedAt || 0).getTime() || 0;
    const bTime = new Date(b.publishDate || b.publishedAt || 0).getTime() || 0;
    if (bTime !== aTime) return bTime - aTime;
    const aKey = `${a.courseCode || ''}|${a.resultType || ''}`;
    const bKey = `${b.courseCode || ''}|${b.resultType || ''}`;
    return aKey.localeCompare(bKey);
  });
};

export const downloadResultFile = async (user, resultId) => {
  const result = await Result.findById(resultId).lean();

  if (!result) throw new AppError('Result not found', 404);

  const isStudent = user.role === 'student';

  if (isStudent) {
    const student = await Student.findOne({ userId: user._id });

    if (
      !student ||
      !result.isPublished ||
      result.isArchived ||
      !(result.status === 'published' || result.isPublished)
    ) {
      throw new AppError('Access denied', 403);
    }

    const ownsResult = result.student?.toString() === student._id.toString();
    const matchesCohort = await studentMatchesResultCohort(student, result);

    if (!ownsResult && !matchesCohort) {
      throw new AppError('Access denied', 403);
    }
  } else if (user.role === 'teacher') {
    const teacher = await findTeacher(user._id);

    if (result.teacherId?.toString() !== teacher._id.toString()) {
      throw new AppError('Access denied', 403);
    }
  } else {
    throw new AppError('Access denied', 403);
  }

  if (!result.fileUrl) {
    throw new AppError('No file attached to this result', 404);
  }

  const { url, data, contentType } = await downloadFile(result.fileUrl);

  if (url) {
    return {
      url,
      data: null,
      contentType,
      fileName: result.fileName || 'result-download',
    };
  }

  return {
    data,
    contentType,
    fileName: result.fileName || 'result-download',
  };
};
