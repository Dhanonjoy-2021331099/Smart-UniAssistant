import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  noticeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Notice' },
  scheduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'DailySchedule' },
  resultId: { type: mongoose.Schema.Types.ObjectId, ref: 'Result' },
  courseCode: String,
  courseName: String,
  semester: String,
  resultType: String,
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  teacherName: String,
  publishDate: Date,
  link: { type: String },
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
notificationSchema.index({ scheduleId: 1 });
notificationSchema.index({ resultId: 1 });

export default mongoose.model('Notification', notificationSchema);
