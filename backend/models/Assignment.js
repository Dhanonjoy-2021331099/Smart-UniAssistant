import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
  teacherCourseId: { type: mongoose.Schema.Types.ObjectId, ref: 'TeacherCourse', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  title: { type: String, required: true },
  description: String,
  instructions: String,
  maxMarks: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  attachments: [{
    fileName: String,
    filePath: String,
    fileSize: Number
  }],
  isPublished: { type: Boolean, default: false },
  allowLateSubmission: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

assignmentSchema.index({ teacherCourseId: 1, isPublished: 1, dueDate: 1 });
assignmentSchema.index({ teacher: 1, createdAt: -1 });

export default mongoose.model('Assignment', assignmentSchema);
