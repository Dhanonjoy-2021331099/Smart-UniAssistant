import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Student from '../models/Student.js';
import { RESULT_TYPE_LABELS } from '../models/Result.js';
import { findStudentsInCohort } from './cohort.service.js';
import { getIO } from '../config/socket.js';

export const resolveRecipientUID = (user) => user?.firebaseUid || String(user?._id);

export const notificationsExistForNotice = async (noticeId) =>
  Boolean(
    noticeId &&
      (await Notification.exists({
        noticeId,
        recipientRole: 'student',
      })),
  );

const getActiveStudents = async () =>
  User.find({ role: 'student', isActive: true })
    .select('firebaseUid _id')
    .lean();

export const createNoticeNotifications = async (notice) => {
  if (!notice || notice.status !== 'published') {
    return;
  }

  if (await notificationsExistForNotice(notice._id)) {
    return;
  }

  const students = await getActiveStudents();

  if (students.length === 0) {
    return;
  }

  const notifications = students.map((student) => ({
    title: 'New Notice',
    message: notice.title,
    noticeId: notice._id,
    recipientRole: 'student',
    recipientUID: student.firebaseUid || String(student._id),
  }));

  await Notification.insertMany(notifications);

  const io = getIO();

  if (io) {
    io.to('students').emit('notice:published', {
      noticeId: notice._id,
      title: notice.title,
      category: notice.category,
      priority: notice.priority,
    });
  }
};

export const createScheduleNotifications = async (schedule, mode) => {
  if (!schedule || schedule.status !== 'published') {
    return;
  }

  const isUpdate = mode === 'update';

  const students = await getActiveStudents();

  if (students.length === 0) {
    return;
  }

  const notifications = students.map((student) => ({
    title: isUpdate
      ? "Tomorrow's Class Schedule Updated"
      : "Tomorrow's Class Schedule Published",
    message: isUpdate
      ? 'Some classes have been modified.'
      : "Tomorrow's class schedule is now available.",
    scheduleId: schedule._id,
    link: '/student/schedule',
    recipientRole: 'student',
    recipientUID: student.firebaseUid || String(student._id),
  }));

  await Notification.insertMany(notifications);

  const io = getIO();

  if (io) {
    io.to('students').emit(
      isUpdate ? 'schedule:updated' : 'schedule:published',
      {
        scheduleId: schedule._id,
        date: schedule.date,
        weekday: schedule.weekday,
      },
    );
  }
};

export const createResultNotifications = async (result, { isUpdate = false } = {}) => {
  if (
    !result ||
    result.status !== 'published' ||
    result.isPublished !== true
  ) {
    return;
  }

  let students = [];

  if (result.student) {
    const student = await Student.findById(result.student).lean();

    if (student) {
      students = [student];
    }
  } else {
    // Class-wide result: notify every student in the matching cohort
    // (department + semester + academic session via registration batch year).
    students = await findStudentsInCohort(result);
  }

  if (students.length === 0) {
    return;
  }

  const userIds = [
    ...new Set(students.map((student) => student.userId?.toString()).filter(Boolean)),
  ];

  const users = await User.find({ _id: { $in: userIds }, isActive: true })
    .select('_id firebaseUid')
    .lean();

  if (users.length === 0) {
    return;
  }

  const userMap = new Map(users.map((user) => [user._id.toString(), user]));

  const resultTypeLabel = RESULT_TYPE_LABELS[result.resultType] || 'Result';
  const courseTitle = result.courseName || result.courseCode || 'Course';
  const title = isUpdate ? 'Result Updated' : 'New Result Published';
  const message = `${courseTitle} - ${resultTypeLabel} result has been ${isUpdate ? 'updated' : 'published'}.`;

  const notifications = students
    .map((student) => {
      const user = userMap.get(student.userId?.toString());

      if (!user) {
        return null;
      }

      return {
        title,
        message,
        resultId: result._id,
        courseCode: result.courseCode,
        courseName: result.courseName,
        semester: result.semester,
        resultType: result.resultType,
        teacherId: result.teacherId,
        teacherName: result.teacherName,
        publishDate: result.publishDate || result.publishedAt,
        link: `/student/results?resultId=${result._id}`,
        recipientRole: 'student',
        recipientUID: resolveRecipientUID(user),
      };
    })
    .filter(Boolean);

  if (notifications.length === 0) {
    return;
  }

  await Notification.insertMany(notifications);

  const io = getIO();

  if (io) {
    io.to('students').emit(isUpdate ? 'result:updated' : 'result:published', {
      resultId: result._id,
      courseCode: result.courseCode,
      courseName: result.courseName,
      resultType: result.resultType,
    });
  }
};

export default {
  createNoticeNotifications,
  createScheduleNotifications,
  createResultNotifications,
  notificationsExistForNotice,
  resolveRecipientUID,
};
