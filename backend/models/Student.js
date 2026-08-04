import mongoose from 'mongoose';
import { DEPARTMENTS } from './TeacherCourse.js';

const studentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  studentId: { type: String, required: true, unique: true },
  department: { type: String, enum: DEPARTMENTS, default: 'CSE' },
  section: { type: String, default: '' },
  semester: { type: String, default: '' },
  academicSession: { type: String, default: '' },
  session: String,
  bloodGroup: String,
  phone: String,
  address: String,
  currentSemester: { type: Number, default: 1 },
  totalCreditsCompleted: { type: Number, default: 0 },
  overallCGPA: { type: Number, default: 0 },
  semesterGPAs: [{
    semester: Number,
    gpa: Number,
    credits: Number,
    year: String
  }],
  enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Student', studentSchema);
