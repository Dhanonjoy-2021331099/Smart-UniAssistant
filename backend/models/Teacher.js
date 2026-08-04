import mongoose from 'mongoose';
import { DEPARTMENTS } from './TeacherCourse.js';

const teacherSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  teacherId: { type: String, required: true, unique: true },
  department: { type: String, enum: DEPARTMENTS, default: 'CSE' },
  designation: String,
  phone: String,
  officeRoom: String,
  specialization: [String],
  assignedCourses: [{
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    semester: String,
    year: String
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Teacher', teacherSchema);
