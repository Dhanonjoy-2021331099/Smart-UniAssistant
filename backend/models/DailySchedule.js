import mongoose from "mongoose";
import { WEEKDAYS, SCHEDULE_STATUSES } from "../config/scheduleConfig.js";
import {
  classEntrySchema,
  scheduleOverrideSchema,
  scheduleHistoryEntrySchema,
} from "./schedule.schemas.js";

const dailyScheduleSchema = new mongoose.Schema(
  {
    batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch" },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: { type: Date, required: true },
    weekday: { type: String, enum: WEEKDAYS, required: true },
    status: {
      type: String,
      enum: SCHEDULE_STATUSES,
      default: "draft",
    },
    sourceRoutineId: { type: mongoose.Schema.Types.ObjectId, ref: "WeeklyRoutine" },
    overrides: { type: [scheduleOverrideSchema], default: [] },
    extras: { type: [classEntrySchema], default: [] },
    deletedClassIds: { type: [String], default: [] },
    note: { type: String, trim: true, default: "" },
    history: { type: [scheduleHistoryEntrySchema], default: [] },
    publishedAt: { type: Date },
  },
  { timestamps: true },
);

dailyScheduleSchema.index({ createdBy: 1, date: 1 }, { unique: true });
dailyScheduleSchema.index({ status: 1, date: 1 });

export default mongoose.model("DailySchedule", dailyScheduleSchema);
