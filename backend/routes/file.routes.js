import express from 'express';
import { downloadFileById, downloadFileByPath } from '../controllers/file.controller.js';
import authenticate from '../middleware/auth.js';

const router = express.Router();

router.get('/:fileId/download', authenticate, downloadFileById);
router.get('/*', authenticate, downloadFileByPath);

export default router;