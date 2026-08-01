import Notification from '../models/Notification.js';
import User from '../models/User.js';
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

export default {
  createNoticeNotifications,
  createScheduleNotifications,
  notificationsExistForNotice,
  resolveRecipientUID,
};
