import mongoose from 'mongoose';

export const RESULT_TYPES = [
  'mid1',
  'mid2',
  'final',
  'lab',
  'assignment',
  'quiz',
  'project',
  'viva',
];

export const RESULT_TYPE_LABELS = {
  mid1: 'Mid Term 1',
  mid2: 'Mid Term 2',
  final: 'Final',
  lab: 'Lab',
  assignment: 'Assignment',
  quiz: 'Quiz',
  project: 'Project',
  viva: 'Viva',
};

const resultVersionSchema = new mongoose.Schema(
  {
    version: Number,
    marks: { type: Number, default: 0 },
    maxMarks: { type: Number, default: 0 },
    remarks: String,
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
    fileUrl: String,
    fileName: String,
    previousPDF: String,
    currentPDF: String,
    reason: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedByName: String,
    updatedDate: String,
    updatedTime: String,
    replacedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    replacedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const publishInfoSchema = new mongoose.Schema(
  {
    publishedDate: String,
    publishedTime: String,
    teacherName: String,
    course: String,
    shortName: String,
    semester: String,
    department: String,
    departmentName: String,
    courseCode: String,
    resultType: String,
    section: String,
    academicSession: String,
    updatedDate: String,
    updatedTime: String,
    updatedByName: String,
    updatedAt: Date,
  },
  { _id: false },
);

const resultSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  teacherCourseId: { type: mongoose.Schema.Types.ObjectId, ref: 'TeacherCourse' },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  department: { type: String, default: 'CSE' },
  departmentName: { type: String, default: '' },
  semester: { type: String, default: '' },
  section: { type: String, default: '' },
  courseType: { type: String, default: '' },
  academicSession: { type: String, default: '' },
  year: { type: String, default: '' },
  resultType: {
    type: String,
    enum: RESULT_TYPES,
    default: 'final',
  },
  courseCode: { type: String, default: '' },
  courseName: { type: String, default: '' },
  shortName: { type: String, default: '' },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  teacherName: { type: String, default: '' },
  studentId: { type: String, default: '' },
  studentName: { type: String, default: '' },
  marks: { type: Number, default: 0 },
  maxMarks: { type: Number, default: 100 },
  remarks: String,
  quizMarks: { type: Number, default: 0 },
  assignmentMarks: { type: Number, default: 0 },
  labMarks: { type: Number, default: 0 },
  midMarks: { type: Number, default: 0 },
  finalMarks: { type: Number, default: 0 },
  totalMarks: { type: Number, default: 0 },
  letterGrade: String,
  gradePoint: Number,
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
  },
  isPublished: { type: Boolean, default: false },
  visibility: {
    type: String,
    enum: ['students', 'teachers', 'both'],
    default: 'students',
  },
  publishDate: Date,
  publishInfo: publishInfoSchema,
  fileUrl: String,
  fileName: String,
  fileSize: Number,
  isArchived: { type: Boolean, default: false },
  versions: [resultVersionSchema],
  publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  publishedAt: Date,
  lastUpdatedAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

resultSchema.index(
  { student: 1, teacherCourseId: 1, resultType: 1 },
  { unique: true },
);
resultSchema.index({ teacherId: 1, status: 1 });
resultSchema.index({ student: 1, isPublished: 1 });

export default mongoose.model('Result', resultSchema);
