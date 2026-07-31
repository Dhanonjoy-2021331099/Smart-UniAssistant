import mongoose from 'mongoose';

const routineSchema = new mongoose.Schema({
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  semester: String,
  type: { type: String, enum: ['class', 'exam'], required: true },
  schedule: [{
    day: { type: String, enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
    startTime: String,
    endTime: String,
    room: String,
    type: { type: String, enum: ['theory', 'lab', 'exam'] }
  }],
  examSchedule: [{
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    examType: { type: String, enum: ['mid', 'final', 'lab', 'quiz'] },
    date: Date,
    startTime: String,
    endTime: String,
    room: String,
    syllabus: String
  }],
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Routine', routineSchema);