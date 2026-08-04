import { isValidObjectId } from '../utils/validators.js';
import TeacherCourse from '../models/TeacherCourse.js';
import Student from '../models/Student.js';

export const resolveDepartmentCode = (value) => {
  if (!value) return '';
  const s = String(value);

  if (isValidObjectId(s)) {
    return '';
  }

  return s.toUpperCase();
};

// First 4 digits of the registration number are the batch year.
// Example: "2021331099" -> "2021"
export const extractBatchYear = (registrationNumber) => {
  const s = String(registrationNumber || '').trim();
  const match = s.match(/^\d{4}/);
  return match ? match[0] : '';
};

// First year of an academic session string.
// Example: "2021-22" -> "2021"
export const extractSessionYear = (academicSession) => {
  const s = String(academicSession || '').trim();
  const match = s.match(/^\d{4}/);
  return match ? match[0] : '';
};

// An academic session belongs to the student when its first year equals the
// batch year derived from the student's registration number.
// "2021-22" matches registration "2021331099" because 2021 == 2021.
export const sessionMatchesBatch = (academicSession, registrationNumber) => {
  const sessionYear = extractSessionYear(academicSession);
  const batchYear = extractBatchYear(registrationNumber);
  return Boolean(sessionYear && batchYear && sessionYear === batchYear);
};

// Mongo query used to find the student's cohort (TeacherCourse / Result docs).
// Matching is Department + Semester + Academic Session (batch year), with NO
// section filter.
export const buildStudentCohortQuery = (student) => {
  const department = resolveDepartmentCode(student.department);
  const batchYear = extractBatchYear(student.studentId);

  if (!department || !student.semester || !batchYear) {
    return null;
  }

  return {
    department,
    semester: String(student.semester),
    academicSession: { $regex: `^${batchYear}` },
  };
};

// Mongo query used to find every Student who belongs to a given course cohort
// (Department + Semester + Academic Session via registration batch year).
// Used to notify students of a class-wide published result. NO section filter.
export const buildCohortStudentQuery = ({ department, semester, academicSession }) => {
  const departmentCode = resolveDepartmentCode(department);
  const sessionYear = extractSessionYear(academicSession);

  if (!departmentCode || !semester || !sessionYear) {
    return null;
  }

  return {
    department: departmentCode,
    semester: String(semester),
    studentId: { $regex: `^${sessionYear}` },
  };
};

export const findStudentsInCohort = async ({ department, semester, academicSession }) => {
  const query = buildCohortStudentQuery({ department, semester, academicSession });

  if (!query) {
    return [];
  }

  return Student.find(query)
    .select('_id studentId userId department semester academicSession session')
    .lean();
};

export const matchCohort = (assignment, student, assignmentCode) => {
  const studentCode = resolveDepartmentCode(student.department);

  if (studentCode && assignmentCode && studentCode !== assignmentCode) {
    return {
      ok: false,
      reason: `Student ${student.studentId} does not belong to department ${assignmentCode}`,
    };
  }

  if (
    student.semester &&
    assignment.semester &&
    String(student.semester) !== String(assignment.semester)
  ) {
    return {
      ok: false,
      reason: `Student ${student.studentId} does not belong to semester ${assignment.semester}`,
    };
  }

  if (!sessionMatchesBatch(assignment.academicSession, student.studentId)) {
    return {
      ok: false,
      reason: `Student ${student.studentId} does not belong to academic session ${assignment.academicSession}`,
    };
  }

  return { ok: true };
};

export const studentMatchesResultCohort = async (student, result) => {
  const department = resolveDepartmentCode(student.department);

  if (!department || !student.semester) {
    return false;
  }

  if (result.department !== department) {
    return false;
  }

  if (result.semester && String(result.semester) !== String(student.semester)) {
    return false;
  }

  if (!sessionMatchesBatch(result.academicSession, student.studentId)) {
    return false;
  }

  if (result.courseCode) {
    const cohortQuery = buildStudentCohortQuery(student);

    if (!cohortQuery) {
      return false;
    }

    const courseExists = await TeacherCourse.exists({
      ...cohortQuery,
      status: 'active',
      courseCode: result.courseCode,
    });

    if (!courseExists) {
      return false;
    }
  }

  return true;
};
