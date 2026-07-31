import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
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

export default mongoose.model('Assignment', assignmentSchema);