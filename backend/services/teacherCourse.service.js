import Teacher from '../models/Teacher.js';
import TeacherCourse, {
  COURSE_SECTIONS,
  TEACHER_COURSE_TYPES,
  DEPARTMENT_NAME_MAP,
} from '../models/TeacherCourse.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import {
  isValidObjectId,
  validateDepartmentCode,
  validateAcademicSession,
} from '../utils/validators.js';

export const COURSE_TYPE_LABELS = {
  theory: 'Theory',
  lab: 'Lab',
  both: 'Theory + Lab',
};

export const COURSE_SECTION_LABELS = {
  A: 'A',
  B: 'B',
  'A+B': 'A+B',
};

const findTeacher = async (userId) => {
  const teacher = await Teacher.findOne({ userId });

  if (!teacher) {
    throw new AppError('Teacher profile not found', 404);
  }

  return teacher;
};

const assertOwnership = async (teacher, teacherCourseId) => {
  if (!isValidObjectId(teacherCourseId)) {
    throw new AppError('Invalid course assignment ID', 400);
  }

  const assignment = await TeacherCourse.findOne({
    _id: teacherCourseId,
    teacher: teacher._id,
  });

  if (!assignment) {
    throw new AppError('Course assignment not found', 404);
  }

  return assignment;
};

const resolveTeacherName = async (teacher) => {
  const teacherUser = await User.findById(teacher.userId)
    .select('name')
    .lean();

  return teacherUser?.name || teacher.teacherId;
};

const isDuplicateKeyError = (error) => error?.code === 11000;

export const listTeacherCourses = async (user, { includeArchived = false } = {}) => {
  const teacher = await findTeacher(user._id);
  const filter = { teacher: teacher._id };

  if (!includeArchived) {
    filter.status = { $ne: 'archived' };
  }

  const courses = await TeacherCourse.find(filter)
    .sort({ semester: 1, courseCode: 1, createdAt: -1 })
    .lean();

  return courses.map((course) => ({
    ...course,
    courseTypeLabel: COURSE_TYPE_LABELS[course.courseType] || 'Theory',
    sectionLabel: COURSE_SECTION_LABELS[course.section] || course.section,
  }));
};

export const createTeacherCourse = async (user, payload) => {
  const teacher = await findTeacher(user._id);
  const {
    department,
    semester,
    courseName,
    shortName,
    courseCode,
    section,
    courseType,
    academicSession,
    academicYear,
    credits,
    room,
    maxStudents,
  } = payload;

  if (
    !department ||
    !semester ||
    !courseName ||
    !courseCode ||
    !section ||
    !academicSession
  ) {
    throw new AppError(
      'Department, semester, course name, course code, section and academic session are required',
      400,
    );
  }

  const normalizedCode = String(courseCode).trim().toUpperCase();
  const normalizedName = String(courseName).trim();

  if (!normalizedCode) {
    throw new AppError('Course code is required', 400);
  }

  if (!normalizedName) {
    throw new AppError('Course name is required', 400);
  }

  validateDepartmentCode(department);

  const normalizedSession = validateAcademicSession(academicSession);

  if (!COURSE_SECTIONS.includes(section)) {
    throw new AppError('Invalid section', 400);
  }

  if (courseType && !TEACHER_COURSE_TYPES.includes(courseType)) {
    throw new AppError('Invalid course type', 400);
  }

  const teacherName = await resolveTeacherName(teacher);

  const existing = await TeacherCourse.exists({
    department,
    semester: String(semester),
    section,
    courseCode: normalizedCode,
    academicSession: normalizedSession,
  });

  if (existing) {
    throw new AppError(
      'This course is already assigned to a teacher for the same department, semester, section and academic session',
      409,
    );
  }

  try {
    return await TeacherCourse.create({
      teacher: teacher._id,
      teacherId: teacher.teacherId,
      teacherName,
      department,
      departmentName: DEPARTMENT_NAME_MAP[department] || department,
      semester: String(semester),
      courseName: normalizedName,
      shortName: String(shortName || '').trim(),
      courseCode: normalizedCode,
      section,
      courseType: courseType || 'theory',
      academicSession: normalizedSession,
      academicYear: String(academicYear || '').trim(),
      credits: Math.max(parseFloat(credits) || 0, 0),
      room: String(room || '').trim(),
      maxStudents: Math.max(parseInt(maxStudents, 10) || 0, 0),
      status: 'active',
      isActive: true,
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new AppError(
        'This course is already assigned to you for the same department, semester, section and academic session',
        409,
      );
    }

    throw error;
  }
};

export const updateTeacherCourse = async (user, teacherCourseId, payload) => {
  const teacher = await findTeacher(user._id);
  const assignment = await assertOwnership(teacher, teacherCourseId);

  const allowed = [
    'department',
    'semester',
    'courseName',
    'shortName',
    'courseCode',
    'section',
    'courseType',
    'academicSession',
    'academicYear',
    'credits',
    'room',
    'maxStudents',
  ];

  const changes = {};

  for (const key of allowed) {
    if (payload[key] !== undefined) {
      changes[key] = payload[key];
    }
  }

  if (changes.courseName !== undefined) {
    changes.courseName = String(changes.courseName).trim();
  }

  if (changes.courseCode !== undefined) {
    changes.courseCode = String(changes.courseCode).trim().toUpperCase();
  }

  if (changes.department !== undefined) {
    validateDepartmentCode(changes.department);
    changes.departmentName = DEPARTMENT_NAME_MAP[changes.department] || changes.department;
  }

  if (changes.academicSession !== undefined) {
    changes.academicSession = validateAcademicSession(changes.academicSession);
  }

  if (changes.section !== undefined && !COURSE_SECTIONS.includes(changes.section)) {
    throw new AppError('Invalid section', 400);
  }

  if (changes.courseType !== undefined && !TEACHER_COURSE_TYPES.includes(changes.courseType)) {
    throw new AppError('Invalid course type', 400);
  }

  if (changes.credits !== undefined) {
    changes.credits = Math.max(parseFloat(changes.credits) || 0, 0);
  }

  if (changes.maxStudents !== undefined) {
    changes.maxStudents = Math.max(parseInt(changes.maxStudents, 10) || 0, 0);
  }

  const department = changes.department ?? assignment.department;
  const semester = String(changes.semester ?? assignment.semester);
  const section = changes.section ?? assignment.section;
  const courseCode = changes.courseCode ?? assignment.courseCode;
  const academicSession = changes.academicSession ?? assignment.academicSession;

  const duplicate = await TeacherCourse.exists({
    department,
    semester,
    section,
    courseCode,
    academicSession,
    _id: { $ne: teacherCourseId },
  });

  if (duplicate) {
    throw new AppError(
      'This course is already assigned to a teacher for the same department, semester, section and academic session',
      409,
    );
  }

  try {
    return await TeacherCourse.findByIdAndUpdate(
      teacherCourseId,
      { ...changes, updatedAt: new Date() },
      { returnDocument: 'after', runValidators: true },
    );
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new AppError(
        'This course is already assigned to you for the same department, semester, section and academic session',
        409,
      );
    }

    throw error;
  }
};

export const archiveTeacherCourse = async (user, teacherCourseId) => {
  const teacher = await findTeacher(user._id);
  await assertOwnership(teacher, teacherCourseId);

  return TeacherCourse.findByIdAndUpdate(
    teacherCourseId,
    { status: 'archived', isActive: false, updatedAt: new Date() },
    { returnDocument: 'after' },
  );
};

export const deactivateTeacherCourse = async (user, teacherCourseId) => {
  const teacher = await findTeacher(user._id);
  await assertOwnership(teacher, teacherCourseId);

  return TeacherCourse.findByIdAndUpdate(
    teacherCourseId,
    { status: 'inactive', isActive: false, updatedAt: new Date() },
    { returnDocument: 'after' },
  );
};

export const activateTeacherCourse = async (user, teacherCourseId) => {
  const teacher = await findTeacher(user._id);
  await assertOwnership(teacher, teacherCourseId);

  return TeacherCourse.findByIdAndUpdate(
    teacherCourseId,
    { status: 'active', isActive: true, updatedAt: new Date() },
    { returnDocument: 'after' },
  );
};

export const removeTeacherCourse = async (user, teacherCourseId) => {
  const teacher = await findTeacher(user._id);
  await assertOwnership(teacher, teacherCourseId);

  await TeacherCourse.findByIdAndDelete(teacherCourseId);

  return true;
};

export default {
  listTeacherCourses,
  createTeacherCourse,
  updateTeacherCourse,
  archiveTeacherCourse,
  deactivateTeacherCourse,
  activateTeacherCourse,
  removeTeacherCourse,
};
