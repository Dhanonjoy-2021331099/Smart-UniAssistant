import express from 'express';
import { getEvents } from '../controllers/event.controller.js';
import authenticate from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getEvents);

export default router;