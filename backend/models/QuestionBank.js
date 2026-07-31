import mongoose from 'mongoose';

const questionBankSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
  year: String,
  semester: String,
  examType: { type: String, enum: ['mid', 'final', 'lab', 'viva', 'quiz'], required: true },
  title: String,
  questions: String,
  solution: String,
  fileUrl: String,
  filePath: String,
  fileName: String,
  tags: [String],
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isVerified: { type: Boolean, default: false },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('QuestionBank', questionBankSchema);