import TeacherCourse, {
  COURSE_TYPE_LABELS,
  DEPARTMENT_NAME_MAP,
} from '../models/TeacherCourse.js';
import Teacher from '../models/Teacher.js';
import Student from '../models/Student.js';
import Result from '../models/Result.js';
import User from '../models/User.js';
import { resolveDepartmentCode, buildStudentCohortQuery } from './cohort.service.js';

const resolveTeacherNames = async (courses) => {
  const missing = courses.filter((course) => !course.teacherName);
  const teacherIds = [
    ...new Set(missing.map((course) => course.teacher?.toString()).filter(Boolean)),
  ];

  const nameMap = new Map();

  if (teacherIds.length > 0) {
    const teachers = await Teacher.find({ _id: { $in: teacherIds } })
      .select('userId teacherId')
      .lean();
    const userIds = [
      ...new Set(teachers.map((teacher) => teacher.userId?.toString()).filter(Boolean)),
    ];
    const users = await User.find({ _id: { $in: userIds } })
      .select('_id name')
      .lean();
    const userNameMap = new Map(users.map((user) => [user._id.toString(), user.name]));
    const teacherIdMap = new Map(
      teachers.map((teacher) => [teacher._id.toString(), teacher]),
    );

    for (const course of missing) {
      const teacher = teacherIdMap.get(course.teacher?.toString());
      const name = teacher ? userNameMap.get(teacher.userId?.toString()) : '';
      nameMap.set(course._id.toString(), name || teacher?.teacherId || '');
    }
  }

  return nameMap;
};

const attachResultSummary = async (teacherCourseIds, studentId) => {
  if (teacherCourseIds.length === 0) {
    return new Map();
  }

  const results = await Result.find({
    teacherCourseId: { $in: teacherCourseIds },
    $or: [{ student: null }, { student: studentId }],
    isPublished: true,
    status: 'published',
    isArchived: { $ne: true },
  })
    .select(
      'teacherCourseId resultType publishInfo publishDate publishedAt fileUrl fileName updatedAt',
    )
    .sort({ publishedAt: -1, updatedAt: -1 })
    .lean();

  const summaryMap = new Map();

  for (const result of results) {
    const key = result.teacherCourseId?.toString();

    if (!key) continue;

    const entry = summaryMap.get(key);

    if (!entry) {
      summaryMap.set(key, {
        publishedCount: 1,
        latest: {
          resultId: result._id,
          resultType: result.resultType,
          publishedDate: result.publishInfo?.publishedDate || '',
          publishedTime: result.publishInfo?.publishedTime || '',
          fileName: result.fileName || '',
          hasFile: Boolean(result.fileUrl),
        },
      });
    } else {
      entry.publishedCount += 1;
    }
  }

  return summaryMap;
};

export const listStudentCourses = async (user) => {
  const student = await Student.findOne({ userId: user._id })
    .select('studentId department semester section academicSession session')
    .lean();

  if (!student) {
    return { student: null, courses: [] };
  }

  const cohortQuery = buildStudentCohortQuery(student);

  if (!cohortQuery) {
    return {
      student: {
        studentId: student.studentId || '',
        department: resolveDepartmentCode(student.department),
        semester: student.semester || '',
        section: student.section || '',
        academicSession: student.academicSession || student.session || '',
        hasCompleteCohort: false,
      },
      courses: [],
    };
  }

  const courses = await TeacherCourse.find({
    status: 'active',
    ...cohortQuery,
  }).lean();
  const courseIds = courses.map((course) => course._id);
  const teacherNameMap = await resolveTeacherNames(courses);
  const resultSummary = await attachResultSummary(courseIds, student._id);

  return {
    student: {
      studentId: student.studentId || '',
      department: cohortQuery.department,
      departmentName:
        DEPARTMENT_NAME_MAP[cohortQuery.department] || cohortQuery.department,
      semester: cohortQuery.semester,
      section: student.section || '',
      academicSession: student.academicSession || student.session || '',
      hasCompleteCohort: true,
    },
    courses: courses.map((course) => {
      const summary = resultSummary.get(course._id.toString());

      return {
        _id: course._id,
        courseCode: course.courseCode || '',
        courseName: course.courseName || '',
        shortName: course.shortName || '',
        credits: course.credits || 0,
        courseType: course.courseType || 'theory',
        courseTypeLabel: COURSE_TYPE_LABELS[course.courseType] || 'Theory',
        section: course.section || '',
        semester: course.semester || '',
        department: course.department || '',
        departmentName: course.departmentName || course.department || '',
        academicSession: course.academicSession || '',
        academicYear: course.academicYear || '',
        room: course.room || '',
        maxStudents: course.maxStudents || 0,
        teacherName: course.teacherName || teacherNameMap.get(course._id.toString()) || '',
        hasPublishedResults: Boolean(summary && summary.publishedCount > 0),
        publishedCount: summary?.publishedCount || 0,
        latestPublished: summary?.latest || null,
      };
    }),
  };
};

export default {
  listStudentCourses,
};
