import express from 'express';
import multer from 'multer';
import { getDashboard, createEvent, manageRoutine, uploadResource } from '../controllers/cradmin.controller.js';
import authenticate from '../middleware/auth.js';
import { requireCRAdmin } from '../middleware/rbac.js';

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);
router.use(requireCRAdmin);

router.get('/dashboard', getDashboard);
router.post('/events', createEvent);
router.post('/routines', manageRoutine);
router.post('/resources', upload.single('file'), uploadResource);

export default router;