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

export const createNoticeNotifications = async (notice) => {
  if (!notice || notice.status !== 'published') {
    return;
  }

  if (await notificationsExistForNotice(notice._id)) {
    return;
  }

  const students = await User.find({ role: 'student', isActive: true })
    .select('firebaseUid _id')
    .lean();

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

export default { createNoticeNotifications, notificationsExistForNotice, resolveRecipientUID };
