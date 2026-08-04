import express from 'express';
import multer from 'multer';
import {
  listResults,
  createResult,
  bulkCreate,
  uploadResult,
  publish,
  publishUpload,
  publishPdf,
  bulkPublish,
  replace,
  replaceFile,
  versions,
  archive,
  permanentDelete,
  myResults,
  download,
} from '../controllers/result.controller.js';
import authenticate from '../middleware/auth.js';
import { requireTeacher, requireStudent } from '../middleware/rbac.js';

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

router.use(authenticate);

// Student route: fetch own published results
router.get('/my', requireStudent, myResults);

// Download result file (teacher who owns it, or the student it belongs to)
router.get('/download/:resultId', download);

// Teacher routes
router.get('/', requireTeacher, listResults);
router.post('/', requireTeacher, createResult);
router.post(
  '/upload',
  requireTeacher,
  upload.single('file'),
  uploadResult,
);
router.post('/bulk', requireTeacher, bulkCreate);
router.post('/publish-upload', requireTeacher, publishUpload);
router.post(
  '/publish-pdf',
  requireTeacher,
  upload.single('file'),
  publishPdf,
);
router.post('/bulk-publish', requireTeacher, bulkPublish);
router.post('/publish', requireTeacher, bulkPublish);
router.post('/:resultId/publish', requireTeacher, publish);
router.post('/:resultId/replace', requireTeacher, replace);
router.post(
  '/:resultId/replace-file',
  requireTeacher,
  upload.single('file'),
  replaceFile,
);
router.get('/:resultId/versions', requireTeacher, versions);
router.delete('/:resultId/permanent', requireTeacher, permanentDelete);
router.delete('/:resultId', requireTeacher, archive);

export default router;
