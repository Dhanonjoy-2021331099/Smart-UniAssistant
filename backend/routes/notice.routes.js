import express from "express";
import multer from "multer";
import authenticate from "../middleware/auth.middleware.js";
import {
  requireNoticeManager,
  requireNoticeViewer,
} from "../middleware/role.middleware.js";
import {
  createNotice,
  getNotices,
  getNotice,
  updateNotice,
  deleteNotice,
} from "../controllers/notice.controller.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.use(authenticate);
router.use(requireNoticeViewer);

router.get("/", getNotices);
router.get("/:id", getNotice);

router.post("/", requireNoticeManager, upload.single("attachment"), createNotice);
router.put("/:id", requireNoticeManager, upload.single("attachment"), updateNotice);
router.delete("/:id", requireNoticeManager, deleteNotice);

export default router;
