import express from 'express';
import multer from 'multer';
import { getDashboard, getMyCourses, uploadCourseMaterial, createAssignment, getAssignmentSubmissions, gradeSubmission, uploadResults } from '../controllers/teacher.controller.js';
import authenticate from '../middleware/auth.js';
import { requireTeacher } from '../middleware/rbac.js';

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

router.use(authenticate);
router.use(requireTeacher);

router.get('/dashboard', getDashboard);
router.get('/courses', getMyCourses);
router.post('/materials', upload.single('file'), uploadCourseMaterial);
router.post('/assignments', createAssignment);
router.get('/assignments/:assignmentId/submissions', getAssignmentSubmissions);
router.put('/submissions/:submissionId/grade', gradeSubmission);
router.post('/results', uploadResults);

export default router;