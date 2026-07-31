import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['assignment', 'result', 'notice', 'event', 'announcement', 'message'], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  relatedId: mongoose.Schema.Types.ObjectId,
  relatedModel: { type: String, enum: ['Assignment', 'Result', 'Notice', 'Event', 'Course'] },
  isRead: { type: Boolean, default: false },
  readAt: Date,
  createdAt: { type: Date, default: Date.now }
});

notificationSchema.index({ recipient: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);