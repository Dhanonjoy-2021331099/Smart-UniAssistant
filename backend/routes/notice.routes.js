import express from "express";
import multer from "multer";
import authenticate from "../middleware/auth.js";
import {
  requireNoticeManager,
  requireNoticeViewer,
} from "../middleware/rbac.js";
import { sendError } from "../utils/apiResponse.js";
import { MAX_ATTACHMENT_SIZE } from "../config/storage.js";
import {
  createNotice,
  getNotices,
  getNotice,
  updateNotice,
  deleteNotice,
  togglePin,
  updateStatus,
} from "../controllers/notice.controller.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_ATTACHMENT_SIZE, files: 11 },
});

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return sendError(
        res,
        400,
        "Each attachment must be 10MB or smaller",
      );
    }

    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return sendError(
        res,
        400,
        "Too many files. Maximum of 10 attachments allowed.",
      );
    }

    return sendError(res, 400, `Upload failed: ${err.code}`);
  }

  if (err) {
    return sendError(res, 400, err.message || "Upload failed");
  }

  next();
};

router.use(authenticate);
router.use(requireNoticeViewer);

router.get("/", getNotices);
router.get("/:id", getNotice);

router.post(
  "/",
  requireNoticeManager,
  upload.fields([
    { name: "attachments", maxCount: 10 },
    { name: "attachment", maxCount: 1 },
  ]),
  handleMulterError,
  createNotice,
);
router.put(
  "/:id",
  requireNoticeManager,
  upload.fields([
    { name: "attachments", maxCount: 10 },
    { name: "attachment", maxCount: 1 },
  ]),
  handleMulterError,
  updateNotice,
);
router.delete("/:id", requireNoticeManager, deleteNotice);
router.patch("/:id/pin", requireNoticeManager, togglePin);
router.patch("/:id/status", requireNoticeManager, updateStatus);

export default router;
