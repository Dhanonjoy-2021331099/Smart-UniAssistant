import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  noticeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Notice' },
  recipientRole: {
    type: String,
    enum: ['student', 'teacher', 'cr_admin', 'super_admin'],
    required: true,
  },
  recipientUID: { type: String },
  isRead: { type: Boolean, default: false },
  readAt: Date,
  createdAt: { type: Date, default: Date.now },
});

notificationSchema.index({ recipientRole: 1, recipientUID: 1, createdAt: -1 });
notificationSchema.index({ noticeId: 1 });

export default mongoose.model('Notification', notificationSchema);
