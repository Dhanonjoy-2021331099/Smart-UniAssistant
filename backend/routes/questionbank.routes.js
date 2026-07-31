import express from 'express';
import { getQuestions, uploadQuestion } from '../controllers/questionbank.controller.js';
import authenticate from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getQuestions);
router.post('/', uploadQuestion);

export default router;