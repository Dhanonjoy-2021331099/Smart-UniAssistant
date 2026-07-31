import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  type: { type: String, enum: ['book', 'pdf', 'research_paper', 'code', 'link', 'video', 'other'], required: true },
  category: { type: String, enum: ['programming', 'mathematics', 'physics', 'chemistry', 'engineering', 'general', 'other'] },
  fileUrl: String,
  filePath: String,
  fileName: String,
  fileSize: Number,
  externalLink: String,
  tags: [String],
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isPublic: { type: Boolean, default: true },
  downloads: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Resource', resourceSchema);