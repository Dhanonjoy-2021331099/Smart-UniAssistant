import mongoose from 'mongoose';

const resultSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
  semester: String,
  year: String,
  quizMarks: { type: Number, default: 0 },
  assignmentMarks: { type: Number, default: 0 },
  labMarks: { type: Number, default: 0 },
  midMarks: { type: Number, default: 0 },
  finalMarks: { type: Number, default: 0 },
  totalMarks: { type: Number, default: 0 },
  letterGrade: String,
  gradePoint: Number,
  isPublished: { type: Boolean, default: false },
  publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  publishedAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

resultSchema.index({ student: 1, course: 1, semester: 1 }, { unique: true });

export default mongoose.model('Result', resultSchema);