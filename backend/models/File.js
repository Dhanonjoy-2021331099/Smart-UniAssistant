import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  originalFileName: { type: String, required: true },
  storagePath: { type: String, required: true },
  contentType: String,
  size: Number,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  relatedModel: String,
  relatedId: mongoose.Schema.Types.ObjectId,
  isDeleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('File', fileSchema);