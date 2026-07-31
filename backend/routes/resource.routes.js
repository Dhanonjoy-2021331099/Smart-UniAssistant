import express from 'express';
import { getResources, incrementDownload } from '../controllers/resource.controller.js';
import authenticate from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getResources);
router.post('/:resourceId/download', incrementDownload);

export default router;