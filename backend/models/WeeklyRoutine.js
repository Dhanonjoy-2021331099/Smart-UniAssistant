import mongoose from "mongoose";
import { classEntrySchema } from "./schedule.schemas.js";

const weeklyRoutineSchema = new mongoose.Schema(
  {
    batch: { type: mongoose.Schema.Types.ObjectId, ref: "Batch" },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    classes: { type: [classEntrySchema], default: [] },
  },
  { timestamps: true },
);

weeklyRoutineSchema.index({ createdBy: 1 }, { unique: true });

export default mongoose.model("WeeklyRoutine", weeklyRoutineSchema);
