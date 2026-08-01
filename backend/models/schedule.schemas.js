import mongoose from "mongoose";
import {
  WEEKDAYS,
  CLASS_TYPES,
  SECTIONS,
  CLASS_MODES,
  MEETING_PLATFORMS,
  CLASS_STATUSES,
} from "../config/scheduleConfig.js";

const classEntrySchema = new mongoose.Schema(
  {
    day: { type: String, enum: WEEKDAYS },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    courseCode: { type: String, required: true, trim: true },
    courseName: { type: String, required: true, trim: true },
    teacher: { type: String, required: true, trim: true },
    classType: { type: String, enum: CLASS_TYPES, required: true },
    section: { type: String, enum: SECTIONS, required: true },
    classMode: { type: String, enum: CLASS_MODES, default: "Physical" },
    room: { type: String, trim: true, default: "" },
    meetingPlatform: {
      type: String,
      enum: ["", ...MEETING_PLATFORMS],
      default: "",
    },
    meetingLink: { type: String, trim: true, default: "" },
    note: { type: String, trim: true, default: "" },
    status: { type: String, enum: CLASS_STATUSES, default: "Regular" },
    modified: { type: Boolean, default: false },
    sourceRoutineId: { type: String, default: null },
  },
  { _id: true },
);

const scheduleOverrideSchema = new mongoose.Schema(
  {
    routineClassId: { type: String, required: true },
    classMode: { type: String, enum: CLASS_MODES },
    startTime: { type: String },
    endTime: { type: String },
    teacher: { type: String, trim: true },
    room: { type: String, trim: true },
    meetingPlatform: {
      type: String,
      enum: ["", ...MEETING_PLATFORMS],
    },
    meetingLink: { type: String, trim: true },
    note: { type: String, trim: true },
    status: { type: String, enum: CLASS_STATUSES },
  },
  { _id: true },
);

const scheduleHistoryEntrySchema = new mongoose.Schema(
  {
    version: { type: Number },
    publishedAt: { type: Date, default: Date.now },
    classes: { type: [classEntrySchema], default: [] },
    note: { type: String, trim: true, default: "" },
  },
  { _id: true },
);

export { classEntrySchema, scheduleOverrideSchema, scheduleHistoryEntrySchema };
