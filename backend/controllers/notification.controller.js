import Notification from '../models/Notification.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { resolveRecipientUID } from '../services/notification.service.js';

const recipientFilter = (user) => ({
  recipientRole: user.role,
  recipientUID: resolveRecipientUID(user),
});

export const getMyNotifications = async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50);
    const skip = Math.max(parseInt(req.query.skip, 10) || 0, 0);

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(recipientFilter(req.user))
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip),
      Notification.countDocuments({
        ...recipientFilter(req.user),
        isRead: false,
      }),
    ]);

    return res.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Get notifications error:', error);
    return sendError(res, 500, error.message || 'Failed to fetch notifications');
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, ...recipientFilter(req.user) },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return sendError(res, 404, 'Notification not found');
    }

    return sendSuccess(res, 200, 'Notification marked as read', notification);
  } catch (error) {
    console.error('Mark notification read error:', error);
    return sendError(res, 500, error.message || 'Failed to mark notification as read');
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { ...recipientFilter(req.user), isRead: false },
      { isRead: true, readAt: new Date() }
    );

    return sendSuccess(res, 200, 'All notifications marked as read');
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    return sendError(res, 500, error.message || 'Failed to mark notifications as read');
  }
};

export default { getMyNotifications, markAsRead, markAllAsRead };
