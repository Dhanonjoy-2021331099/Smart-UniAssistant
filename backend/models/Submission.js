import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  files: [{
    fileName: String,
    filePath: String,
    fileSize: Number,
    fileType: String
  }],
  githubLink: String,
  comments: String,
  submittedAt: { type: Date, default: Date.now },
  isLate: { type: Boolean, default: false },
  marks: Number,
  feedback: String,
  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  gradedAt: Date,
  status: { type: String, enum: ['submitted', 'graded', 'returned'], default: 'submitted' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

export default mongoose.model('Submission', submissionSchema);