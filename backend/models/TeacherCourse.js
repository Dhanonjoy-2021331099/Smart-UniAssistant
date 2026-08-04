import mongoose from 'mongoose';

export const TEACHER_COURSE_STATUS = ['active', 'inactive', 'archived'];
export const COURSE_SECTIONS = ['A', 'B', 'A+B'];
export const TEACHER_COURSE_TYPES = ['theory', 'lab', 'both'];
export const DEPARTMENTS = ['CSE', 'EEE', 'SWE'];

export const DEPARTMENT_OPTIONS = [
  { value: 'CSE', label: 'Computer Science & Engineering' },
  { value: 'EEE', label: 'Electrical & Electronic Engineering' },
  { value: 'SWE', label: 'Software Engineering' },
];

export const DEPARTMENT_NAME_MAP = Object.fromEntries(
  DEPARTMENT_OPTIONS.map((option) => [option.value, option.label]),
);

export const COURSE_TYPE_LABELS = {
  theory: 'Theory',
  lab: 'Lab',
  both: 'Theory + Lab',
};

const teacherCourseSchema = new mongoose.Schema({
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  teacherId: { type: String, default: '' },
  teacherName: { type: String, default: '' },
  department: { type: String, enum: DEPARTMENTS, default: 'CSE' },
  departmentName: { type: String, default: '' },
  semester: { type: String, required: true },
  courseName: { type: String, required: true },
  shortName: { type: String, default: '' },
  courseCode: { type: String, required: true },
  section: { type: String, enum: COURSE_SECTIONS, default: 'A' },
  courseType: {
    type: String,
    enum: TEACHER_COURSE_TYPES,
    default: 'theory',
  },
  academicSession: { type: String, default: '' },
  academicYear: { type: String, default: '' },
  credits: { type: Number, default: 0 },
  room: { type: String, default: '' },
  maxStudents: { type: Number, default: 0 },
  status: {
    type: String,
    enum: TEACHER_COURSE_STATUS,
    default: 'active',
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

teacherCourseSchema.index(
  {
    department: 1,
    semester: 1,
    section: 1,
    courseCode: 1,
    academicSession: 1,
  },
  { unique: true },
);
teacherCourseSchema.index({ teacher: 1, semester: 1 });

export default mongoose.model('TeacherCourse', teacherCourseSchema);
