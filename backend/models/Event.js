import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  type: { type: String, enum: ['academic', 'cultural', 'sports', 'workshop', 'seminar', 'other'], required: true },
  startDate: { type: Date, required: true },
  endDate: Date,
  location: String,
  organizer: String,
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  isPublic: { type: Boolean, default: true },
  attachments: [{
    fileName: String,
    filePath: String
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Event', eventSchema);