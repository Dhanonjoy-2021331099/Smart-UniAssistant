import express from "express";
import authenticate from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import {
  getRoutine,
  saveWeeklyRoutine,
  createScheduleForDate,
  getSchedules,
  getScheduleById,
  updateScheduleById,
  publishScheduleById,
  copyScheduleById,
  restoreScheduleVersion,
  deleteScheduleById,
} from "../controllers/schedule.controller.js";

const router = express.Router();

const requireScheduleManager = requireRole("cr_admin", "super_admin");

router.use(authenticate);

router.get("/routine", requireRole("cr_admin", "teacher", "super_admin"), getRoutine);
router.put("/routine", requireScheduleManager, saveWeeklyRoutine);

router.post("/generate", requireScheduleManager, createScheduleForDate);

router.get("/", getSchedules);
router.get("/:id", getScheduleById);

router.put("/:id", requireScheduleManager, updateScheduleById);
router.patch("/:id/publish", requireScheduleManager, publishScheduleById);
router.post("/:id/copy", requireScheduleManager, copyScheduleById);
router.post(
  "/:id/restore/:historyId",
  requireScheduleManager,
  restoreScheduleVersion,
);
router.delete("/:id", requireScheduleManager, deleteScheduleById);

export default router;
