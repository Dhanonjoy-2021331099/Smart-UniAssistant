import mongoose from 'mongoose';

const teacherCourseSchema = new mongoose.Schema({
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
  semester: String,
  year: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

teacherCourseSchema.index({ teacher: 1, course: 1, batch: 1 }, { unique: true });

export default mongoose.model('TeacherCourse', teacherCourseSchema);