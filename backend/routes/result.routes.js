import express from 'express';
import { publishResults, getResultsByCourse } from '../controllers/result.controller.js';
import authenticate from '../middleware/auth.js';
import { requireTeacher } from '../middleware/rbac.js';

const router = express.Router();

router.use(authenticate);

router.post('/publish', requireTeacher, publishResults);
router.get('/course', getResultsByCourse);

export default router;