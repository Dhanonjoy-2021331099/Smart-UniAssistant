import express from 'express';
import { getDashboard, createEvent, manageRoutine, uploadResource } from '../controllers/cradmin.controller.js';
import authenticate from '../middleware/auth.js';
import { requireCRAdmin } from '../middleware/rbac.js';

const router = express.Router();

router.use(authenticate);
router.use(requireCRAdmin);

router.get('/dashboard', getDashboard);
router.post('/events', createEvent);
router.post('/routines', manageRoutine);
router.post('/resources', uploadResource);

export default router;