import mongoose from 'mongoose';

const courseMaterialSchema = new mongoose.Schema({
  teacherCourseId: { type: mongoose.Schema.Types.ObjectId, ref: 'TeacherCourse', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  title: { type: String, required: true },
  description: String,
  type: { type: String, enum: ['note', 'slide', 'book', 'pdf', 'video', 'link', 'other'], required: true },
  fileUrl: String,
  filePath: String,
  fileName: String,
  fileSize: Number,
  externalLink: String,
  isPublished: { type: Boolean, default: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

courseMaterialSchema.index({ teacherCourseId: 1, createdAt: -1 });

export default mongoose.model('CourseMaterial', courseMaterialSchema);
