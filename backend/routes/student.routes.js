import express from 'express';
import { getDashboard, getResults, getAssignments, getCourseMaterials, calculateCGPA, getCourses, updateProfile } from '../controllers/student.controller.js';
import authenticate from '../middleware/auth.js';
import { requireStudent } from '../middleware/rbac.js';

const router = express.Router();

router.use(authenticate);
router.use(requireStudent);

router.get('/dashboard', getDashboard);
router.get('/results', getResults);
router.get('/assignments', getAssignments);
router.get('/materials', getCourseMaterials);
router.get('/calculate-cgpa', calculateCGPA);
router.get('/courses', getCourses);
router.put('/profile', updateProfile);

export default router;