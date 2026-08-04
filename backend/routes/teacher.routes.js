import express from 'express';
import multer from 'multer';
import { getDashboard, uploadCourseMaterial, createAssignment, getAssignmentSubmissions, gradeSubmission, uploadResults } from '../controllers/teacher.controller.js';
import {
  listCourses,
  createCourse,
  updateCourse,
  archiveCourse,
  deactivateCourse,
  activateCourse,
  deleteCourse,
} from '../controllers/teacherCourse.controller.js';
import authenticate from '../middleware/auth.js';
import { requireTeacher } from '../middleware/rbac.js';

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

router.use(authenticate);
router.use(requireTeacher);

router.get('/dashboard', getDashboard);
router.get('/courses', listCourses);
router.post('/courses', createCourse);
router.put('/courses/:courseId', updateCourse);
router.patch('/courses/:courseId/archive', archiveCourse);
router.patch('/courses/:courseId/deactivate', deactivateCourse);
router.patch('/courses/:courseId/activate', activateCourse);
router.delete('/courses/:courseId', deleteCourse);
router.post('/materials', upload.single('file'), uploadCourseMaterial);
router.post('/assignments', createAssignment);
router.get('/assignments/:assignmentId/submissions', getAssignmentSubmissions);
router.put('/submissions/:submissionId/grade', gradeSubmission);
router.post('/results', uploadResults);

export default router;
