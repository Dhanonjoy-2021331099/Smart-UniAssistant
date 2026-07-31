import express from 'express';
import multer from 'multer';
import { submitAssignment, getMySubmissions } from '../controllers/assignment.controller.js';
import authenticate from '../middleware/auth.js';
import { requireStudent } from '../middleware/rbac.js';

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

router.use(authenticate);

router.post('/submit', requireStudent, upload.array('files', 5), submitAssignment);
router.get('/my-submissions', requireStudent, getMySubmissions);

export default router;