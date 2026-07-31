import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  studentId: { type: String, required: true, unique: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
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