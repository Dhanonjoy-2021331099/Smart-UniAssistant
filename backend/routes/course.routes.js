import express from 'express';
import { getCourses, getCourseById } from '../controllers/course.controller.js';
import authenticate from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getCourses);
router.get('/:courseId', getCourseById);

export default router;