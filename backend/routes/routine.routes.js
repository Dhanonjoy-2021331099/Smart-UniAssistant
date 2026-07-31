import express from 'express';
import { getRoutines } from '../controllers/routine.controller.js';
import authenticate from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getRoutines);

export default router;