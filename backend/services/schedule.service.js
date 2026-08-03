import mongoose from "mongoose";
import AppError from "../utils/AppError.js";
import { mapMongooseError } from "../utils/validators.js";
import WeeklyRoutine from "../models/WeeklyRoutine.js";
import DailySchedule from "../models/DailySchedule.js";
import {
  WEEKDAYS,
  CLASS_TYPES,
  SECTIONS,
  CLASS_MODES,
  MEETING_PLATFORMS,
  CLASS_STATUSES,
  SCHEDULE_STATUSES,
  ROOMS_BY_TYPE,
  getWeekdayForDate,
  isValidRoom,
  isValidTime,
  isEndAfterStart,
  isValidMeetingLink,
} from "../config/scheduleConfig.js";
import { createScheduleNotifications } from "./notification.service.js";

const parseDate = (value, fieldName = "date") => {
  if (!value) {
    throw new AppError(`${fieldName} is required`, 400);
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    throw new AppError(`Invalid ${fieldName}`, 400);
  }

  return date;
};

const validateTimeRange = (startTime, endTime) => {
  if (!isValidTime(startTime)) {
    throw new AppError(
      `Invalid start time "${startTime}". Use 24-hour HH:mm format.`,
      400,
    );
  }

  if (!isValidTime(endTime)) {
    throw new AppError(
      `Invalid end time "${endTime}". Use 24-hour HH:mm format.`,
      400,
    );
  }

  if (!isEndAfterStart(startTime, endTime)) {
    throw new AppError("End time must be after start time", 400);
  }
};

export const validateClassEntry = (entry, options = {}) => {
  const courseCode = entry?.courseCode?.trim();
  const courseName = entry?.courseName?.trim();
  const teacher = entry?.teacher?.trim();
  const classType = entry?.classType;
  const section = entry?.section;
  const classMode = entry?.classMode;
  const room = entry?.room?.trim();
  const meetingPlatform = entry?.meetingPlatform;
  const meetingLink = entry?.meetingLink?.trim();
  const status = entry?.status || "Regular";

  if (!courseCode) {
    throw new AppError("Course code is required", 400);
  }

  if (!courseName) {
    throw new AppError("Course name is required", 400);
  }

  if (!teacher) {
    throw new AppError("Teacher is required", 400);
  }

  if (!CLASS_TYPES.includes(classType)) {
    throw new AppError(
      `Class type must be one of: ${CLASS_TYPES.join(", ")}`,
      400,
    );
  }

  if (!SECTIONS.includes(section)) {
    throw new AppError(`Section must be one of: ${SECTIONS.join(", ")}`, 400);
  }

  if (!CLASS_MODES.includes(classMode)) {
    throw new AppError(`Class mode must be one of: ${CLASS_MODES.join(", ")}`, 400);
  }

  if (classMode === "Physical") {
    if (!room) {
      throw new AppError("Room is required for physical classes", 400);
    }

    if (!isValidRoom(classType, room)) {
      throw new AppError(
        `Invalid room "${room}" for ${classType} class. Available rooms: ${ROOMS_BY_TYPE[classType].join(", ")}`,
        400,
      );
    }
  } else {
    if (!MEETING_PLATFORMS.includes(meetingPlatform)) {
      throw new AppError(
        `Meeting platform must be one of: ${MEETING_PLATFORMS.join(", ")}`,
        400,
      );
    }

    if (!isValidMeetingLink(meetingLink)) {
      throw new AppError("Meeting link must be a valid http(s) URL", 400);
    }
  }

  if (status && !CLASS_STATUSES.includes(status)) {
    throw new AppError(
      `Status must be one of: ${CLASS_STATUSES.join(", ")}`,
      400,
    );
  }

  validateTimeRange(entry.startTime, entry.endTime);

  if (options.requireDay && !WEEKDAYS.includes(entry.day)) {
    throw new AppError(
      `Day must be one of: ${WEEKDAYS.join(", ")}`,
      400,
    );
  }

  return {
    day: entry.day,
    startTime: entry.startTime,
    endTime: entry.endTime,
    courseCode,
    courseName,
    teacher,
    classType,
    section,
    classMode,
    room: classMode === "Physical" ? room : "",
    meetingPlatform: classMode === "Online" ? meetingPlatform : "",
    meetingLink: classMode === "Online" ? meetingLink : "",
    note: entry.note?.trim() || "",
    status: options.forceRegular ? "Regular" : status,
    modified: Boolean(entry.modified),
    sourceRoutineId: entry.sourceRoutineId || null,
  };
};

const sectionOverlaps = (first, second) =>
  first === second || first === "Both" || second === "Both";

export const assertNoDuplicateClasses = (classes) => {
  const seen = [];

  for (const entry of classes) {
    const duplicate = seen.find(
      (existing) =>
        existing.startTime === entry.startTime &&
        sectionOverlaps(existing.section, entry.section),
    );

    if (duplicate) {
      throw new AppError(
        `Duplicate class: Section ${duplicate.section} already has a class at ${entry.startTime}. Please choose a different time.`,
        400,
      );
    }

    seen.push(entry);
  }
};

const normalizeClasses = (rawClasses, options = {}) => {
  const classes = (Array.isArray(rawClasses) ? rawClasses : []).map((entry) =>
    validateClassEntry(entry, options),
  );

  assertNoDuplicateClasses(classes);

  return classes;
};

const classesEqual = (first, second) =>
  first.section === second.section &&
  first.startTime === second.startTime &&
  first.endTime === second.endTime &&
  first.classMode === second.classMode &&
  first.room === second.room &&
  first.meetingPlatform === second.meetingPlatform &&
  first.meetingLink === second.meetingLink &&
  first.teacher === second.teacher &&
  first.status === second.status &&
  (first.note || "") === (second.note || "");

const scheduleHasChanges = (previous, current) => {
  if (previous.length !== current.length) {
    return true;
  }

  const currentByKey = new Map(
    current.map((entry) => [
      `${entry.section}|${entry.startTime}|${entry.courseCode}`,
      entry,
    ]),
  );

  return previous.some((entry) => {
    const match = currentByKey.get(
      `${entry.section}|${entry.startTime}|${entry.courseCode}`,
    );
    return !match || !classesEqual(entry, match);
  });
};

export const getMyRoutine = async (user) => {
  return WeeklyRoutine.findOne({ createdBy: user._id });
};

const getMyRoutineLean = async (userId) => {
  const routine = await WeeklyRoutine.findOne({ createdBy: userId }).lean();
  return routine || null;
};

const toPlainClass = (entry) => {
  if (entry && typeof entry.toObject === "function") {
    return entry.toObject();
  }

  return entry || {};
};

const buildEffectiveClass = ({ baseId, base, override, weekday }) => {
  let room = override?.room !== undefined ? override.room : base.room;
  let meetingPlatform =
    override?.meetingPlatform !== undefined
      ? override.meetingPlatform
      : base.meetingPlatform;
  let meetingLink =
    override?.meetingLink !== undefined ? override.meetingLink : base.meetingLink;
  const classMode = override?.classMode || base.classMode;

  if (override?.classMode) {
    if (classMode === "Physical") {
      meetingPlatform = "";
      meetingLink = "";
    } else {
      room = "";
    }
  }

  return {
    _id: baseId,
    day: weekday,
    startTime: override?.startTime ?? base.startTime,
    endTime: override?.endTime ?? base.endTime,
    courseCode: base.courseCode,
    courseName: base.courseName,
    teacher: override?.teacher ?? base.teacher,
    classType: base.classType,
    section: base.section,
    classMode,
    room,
    meetingPlatform,
    meetingLink,
    note: override?.note ?? base.note ?? "",
    status: override?.status ?? "Regular",
    modified: Boolean(override),
    sourceRoutineId: String(baseId),
  };
};

export const resolveScheduleClasses = (schedule, routine) => {
  const routineClasses =
    (routine?.classes || []).filter((entry) => entry.day === schedule.weekday) ||
    [];
  const byId = new Map(
    routineClasses.map((entry) => [String(entry._id), entry]),
  );
  const overrideById = new Map(
    (schedule.overrides || []).map((override) => [
      String(override.routineClassId),
      override,
    ]),
  );
  const deleted = new Set((schedule.deletedClassIds || []).map(String));

  const classes = [];

  for (const [baseId, base] of byId) {
    if (deleted.has(baseId)) {
      continue;
    }

    classes.push(
      buildEffectiveClass({
        baseId,
        base,
        override: overrideById.get(baseId),
        weekday: schedule.weekday,
      }),
    );
  }

  for (const extra of schedule.extras || []) {
    const plain = toPlainClass(extra);

    classes.push({
      ...plain,
      day: schedule.weekday,
      modified: true,
      sourceRoutineId: null,
    });
  }

  classes.sort((first, second) =>
    `${first.startTime}`.localeCompare(`${second.startTime}`),
  );

  return classes;
};

export const computeScheduleState = (effectiveClasses, routine, weekday) => {
  const routineById = new Map(
    (routine?.classes || [])
      .filter((entry) => entry.day === weekday)
      .map((entry) => [String(entry._id), entry]),
  );
  const overrides = [];
  const extras = [];
  const seen = new Set();

  const pushOverride = (baseId, delta) => {
    if (Object.keys(delta).length > 0) {
      overrides.push({ routineClassId: baseId, ...delta });
    }
  };

  const diffAgainstBase = (eff, base, baseId) => {
    const delta = {};

    if (eff.teacher !== base.teacher) {
      delta.teacher = eff.teacher;
    }

    if (eff.startTime !== base.startTime) {
      delta.startTime = eff.startTime;
    }

    if (eff.endTime !== base.endTime) {
      delta.endTime = eff.endTime;
    }

    if (eff.status !== "Regular") {
      delta.status = eff.status;
    }

    if (eff.classMode !== base.classMode) {
      delta.classMode = eff.classMode;

      if (eff.classMode === "Online") {
        delta.meetingPlatform = eff.meetingPlatform || "";
        delta.meetingLink = eff.meetingLink || "";
        delta.room = "";
      } else {
        delta.room = eff.room || "";
        delta.meetingPlatform = "";
        delta.meetingLink = "";
      }
    } else if (eff.classMode === "Physical") {
      if (eff.room !== base.room) {
        delta.room = eff.room;
      }
    } else {
      if (eff.meetingPlatform !== base.meetingPlatform) {
        delta.meetingPlatform = eff.meetingPlatform;
      }

      if (eff.meetingLink !== base.meetingLink) {
        delta.meetingLink = eff.meetingLink;
      }
    }

    if ((eff.note || "") !== (base.note || "")) {
      delta.note = eff.note || "";
    }

    pushOverride(baseId, delta);
  };

  for (const eff of effectiveClasses) {
    const baseId = eff.sourceRoutineId
      ? String(eff.sourceRoutineId)
      : null;

    if (baseId && routineById.has(baseId)) {
      seen.add(baseId);
      diffAgainstBase(eff, routineById.get(baseId), baseId);
    } else {
      extras.push({
        ...eff,
        _id: undefined,
        day: weekday,
        modified: true,
        sourceRoutineId: null,
      });
    }
  }

  const deletedClassIds = [...routineById.keys()].filter((id) => !seen.has(id));

  return { overrides, extras, deletedClassIds };
};

const toScheduleView = (schedule, routine) => {
  const plain = toPlainClass(schedule);
  const classes = resolveScheduleClasses(schedule, routine);

  return {
    _id: plain._id,
    date: plain.date,
    weekday: plain.weekday,
    status: plain.status,
    note: plain.note || "",
    publishedAt: plain.publishedAt || null,
    sourceRoutineId: plain.sourceRoutineId || null,
    classes,
    history: plain.history || [],
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const saveRoutine = async (user, body) => {
  const classes = normalizeClasses(body?.classes, {
    requireDay: true,
    forceRegular: true,
  });

  if (classes.length === 0) {
    throw new AppError("Add at least one class to the weekly routine", 400);
  }

  const existing = await WeeklyRoutine.findOne({ createdBy: user._id });

  if (existing) {
    existing.classes = classes;

    try {
      await existing.save();
      return existing;
    } catch (error) {
      throw mapMongooseError(error);
    }
  }

  try {
    return await WeeklyRoutine.create({
      batch: body?.batch,
      department: body?.department,
      createdBy: user._id,
      classes,
    });
  } catch (error) {
    throw mapMongooseError(error);
  }
};

export const generateSchedule = async (user, body) => {
  const date = parseDate(body?.date);
  const weekday = getWeekdayForDate(date);

  const existing = await DailySchedule.findOne({
    createdBy: user._id,
    date,
  });

  if (existing) {
    const routine = await getMyRoutineLean(user._id);
    return toScheduleView(existing, routine);
  }

  const routine = await getMyRoutine(user);

  if (!routine) {
    throw new AppError(
      "No base weekly routine found. Please create your weekly routine first.",
      400,
    );
  }

  const routineClasses = routine.classes.filter((entry) => entry.day === weekday);

  if (routineClasses.length === 0) {
    throw new AppError(
      `No classes found for ${weekday} in your weekly routine.`,
      400,
    );
  }

  try {
    const schedule = await DailySchedule.create({
      batch: body?.batch || undefined,
      department: body?.department || undefined,
      createdBy: user._id,
      date,
      weekday,
      status: "draft",
      sourceRoutineId: routine._id,
      overrides: [],
      extras: [],
      deletedClassIds: [],
    });

    return toScheduleView(schedule, routine);
  } catch (error) {
    throw mapMongooseError(error);
  }
};

export const listSchedules = async (user, query = {}) => {
  const { date = "", status = "", page = 1, limit = 20 } = query;
  const filter = {};

  if (user.role === "student") {
    filter.status = "published";
  } else {
    filter.createdBy = user._id;

    if (status) {
      filter.status = status;
    }
  }

  if (date) {
    filter.date = parseDate(date);
  }

  const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
  const limitNumber = Math.min(
    Math.max(parseInt(limit, 10) || 20, 1),
    100,
  );
  const skip = (pageNumber - 1) * limitNumber;

  const [schedules, total] = await Promise.all([
    DailySchedule.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNumber),
    DailySchedule.countDocuments(filter),
  ]);

  const ownerIds = [...new Set(schedules.map((schedule) => String(schedule.createdBy)))];
  const routines = await WeeklyRoutine.find({
    createdBy: { $in: ownerIds },
  }).lean();
  const routineByOwner = new Map(
    routines.map((routine) => [String(routine.createdBy), routine]),
  );

  const view = schedules.map((schedule) =>
    toScheduleView(schedule, routineByOwner.get(String(schedule.createdBy))),
  );

  return {
    schedules: view,
    total,
    page: pageNumber,
    pages: Math.max(Math.ceil(total / limitNumber), 1),
    limit: limitNumber,
  };
};

export const listScheduleHistory = async (user, query = {}) => {
  const { date = "", courseName = "", teacher = "", courseCode = "" } = query;
  const filter = {};

  if (user.role === "student") {
    filter.status = "published";
  } else {
    filter.createdBy = user._id;
  }

  if (date) {
    filter.date = parseDate(date);
  }

  const schedules = await DailySchedule.find(filter).sort({
    date: -1,
    createdAt: -1,
  });

  const ownerIds = [
    ...new Set(schedules.map((schedule) => String(schedule.createdBy))),
  ];
  const routines = await WeeklyRoutine.find({
    createdBy: { $in: ownerIds },
  }).lean();
  const routineByOwner = new Map(
    routines.map((routine) => [String(routine.createdBy), routine]),
  );

  const term = (value) => String(value || "").toLowerCase().trim();
  const courseNameTerm = term(courseName);
  const teacherTerm = term(teacher);
  const courseCodeTerm = term(courseCode);

  const view = schedules
    .map((schedule) =>
      toScheduleView(schedule, routineByOwner.get(String(schedule.createdBy))),
    )
    .map((schedule) => {
      const classes = schedule.classes
        .filter((entry) => {
          if (courseNameTerm && !term(entry.courseName).includes(courseNameTerm)) {
            return false;
          }

          if (teacherTerm && !term(entry.teacher).includes(teacherTerm)) {
            return false;
          }

          if (courseCodeTerm && !term(entry.courseCode).includes(courseCodeTerm)) {
            return false;
          }

          return true;
        })
        .sort((first, second) =>
          `${first.startTime}`.localeCompare(`${second.startTime}`),
        );

      return { ...schedule, classes };
    })
    .filter((schedule) => {
      const hasTermFilter =
        courseNameTerm || teacherTerm || courseCodeTerm;

      return !hasTermFilter || schedule.classes.length > 0;
    });

  return { schedules: view, total: view.length };
};

export const getCourseStatistics = async () => {
  const schedules = await DailySchedule.find({ status: "published" }).sort({
    date: 1,
    createdAt: 1,
  });

  const ownerIds = [
    ...new Set(schedules.map((schedule) => String(schedule.createdBy))),
  ];
  const routines = await WeeklyRoutine.find({
    createdBy: { $in: ownerIds },
  }).lean();
  const routineByOwner = new Map(
    routines.map((routine) => [String(routine.createdBy), routine]),
  );

  const courseKey = (entry) =>
    `${entry.courseName}|${entry.courseCode}|${entry.teacher}|${entry.section}`;

  const statsByCourse = new Map();

  for (const schedule of schedules) {
    const routine = routineByOwner.get(String(schedule.createdBy));
    const classes = resolveScheduleClasses(schedule, routine);
    const scheduleDate = new Date(schedule.date);

    for (const entry of classes) {
      const key = courseKey(entry);
      let record = statsByCourse.get(key);

      if (!record) {
        record = {
          courseName: entry.courseName,
          courseCode: entry.courseCode,
          teacher: entry.teacher,
          section: entry.section,
          theoryCount: 0,
          labCount: 0,
          physicalCount: 0,
          onlineCount: 0,
          totalClasses: 0,
          lastClassDate: scheduleDate,
        };
        statsByCourse.set(key, record);
      }

      if (entry.classType === "Theory") {
        record.theoryCount += 1;
      } else if (entry.classType === "Lab") {
        record.labCount += 1;
      }

      if (entry.classMode === "Physical") {
        record.physicalCount += 1;
      } else if (entry.classMode === "Online") {
        record.onlineCount += 1;
      }

      if (scheduleDate > new Date(record.lastClassDate)) {
        record.lastClassDate = scheduleDate;
      }
    }
  }

  const statistics = [...statsByCourse.values()].map((record) => ({
    ...record,
    totalClasses:
      record.theoryCount +
      record.labCount +
      record.physicalCount +
      record.onlineCount,
  }));

  statistics.sort((first, second) =>
    String(first.courseName).localeCompare(String(second.courseName)),
  );

  return statistics;
};

export const getSchedule = async (user, scheduleId) => {
  if (!mongoose.isValidObjectId(scheduleId)) {
    throw new AppError("Invalid schedule ID", 400);
  }

  const schedule = await DailySchedule.findById(scheduleId);

  if (!schedule) {
    throw new AppError("Schedule not found", 404);
  }

  if (user.role === "student") {
    if (schedule.status !== "published") {
      throw new AppError("Schedule not found", 404);
    }
  } else if (schedule.createdBy.toString() !== user._id.toString()) {
    throw new AppError("Schedule not found", 404);
  }

  const routine = await getMyRoutineLean(schedule.createdBy);

  return toScheduleView(schedule, routine);
};

export const updateSchedule = async (user, scheduleId, body) => {
  const schedule = await DailySchedule.findById(scheduleId);

  if (!schedule || schedule.createdBy.toString() !== user._id.toString()) {
    throw new AppError("Schedule not found", 404);
  }

  const classes = normalizeClasses(
    Array.isArray(body?.classes) ? body.classes : schedule.classes,
  );

  const routine = await getMyRoutineLean(user._id);

  const { overrides, extras, deletedClassIds } = computeScheduleState(
    classes,
    routine,
    schedule.weekday,
  );

  schedule.overrides = overrides;
  schedule.extras = extras;
  schedule.deletedClassIds = deletedClassIds;

  if (typeof body?.note === "string") {
    schedule.note = body.note.trim();
  }

  if (body?.status && SCHEDULE_STATUSES.includes(body.status)) {
    schedule.status = body.status;
  }

  try {
    await schedule.save();
  } catch (error) {
    throw mapMongooseError(error);
  }

  return toScheduleView(schedule, routine);
};

export const publishSchedule = async (user, scheduleId) => {
  const schedule = await DailySchedule.findById(scheduleId);

  if (!schedule || schedule.createdBy.toString() !== user._id.toString()) {
    throw new AppError("Schedule not found", 404);
  }

  const routine = await getMyRoutineLean(user._id);
  const classes = resolveScheduleClasses(schedule, routine);

  if (classes.length === 0) {
    throw new AppError("Cannot publish an empty schedule", 400);
  }

  assertNoDuplicateClasses(classes);

  const wasPublished = schedule.status === "published";
  const previousClasses =
    wasPublished && schedule.history.length > 0
      ? schedule.history[schedule.history.length - 1].classes
      : [];

  const nextVersion = schedule.history.length + 1;

  schedule.status = "published";
  schedule.publishedAt = new Date();
  schedule.history.push({
    version: nextVersion,
    publishedAt: new Date(),
    classes: classes.map((entry) => ({ ...entry, _id: undefined })),
    note: schedule.note || "",
  });

  try {
    await schedule.save();
  } catch (error) {
    throw mapMongooseError(error);
  }

  const hasChanges = scheduleHasChanges(previousClasses, classes);
  const mode = wasPublished && hasChanges ? "update" : "publish";

  await createScheduleNotifications(schedule, mode);

  return toScheduleView(schedule, routine);
};

const matchRoutineClass = (routineClasses, sourceClass) =>
  routineClasses.find(
    (entry) =>
      entry.section === sourceClass.section &&
      entry.courseCode === sourceClass.courseCode &&
      entry.startTime === sourceClass.startTime &&
      entry.classMode === sourceClass.classMode,
  );

export const copySchedule = async (user, scheduleId, body = {}) => {
  const schedule = await DailySchedule.findById(scheduleId);

  if (!schedule || schedule.createdBy.toString() !== user._id.toString()) {
    throw new AppError("Schedule not found", 404);
  }

  let sourceClasses;

  if (body.historyId) {
    const version = schedule.history.id(body.historyId);

    if (!version) {
      throw new AppError("History version not found", 404);
    }

    sourceClasses = version.classes.map((entry) => toPlainClass(entry));
  } else {
    const routine = await getMyRoutineLean(user._id);
    sourceClasses = resolveScheduleClasses(schedule, routine);
  }

  const targetDate = parseDate(body?.targetDate);
  const weekday = getWeekdayForDate(targetDate);

  const existing = await DailySchedule.findOne({
    createdBy: user._id,
    date: targetDate,
  });

  if (existing && existing.status === "published") {
    throw new AppError(
      "Cannot copy over an already published schedule. Choose a different date.",
      409,
    );
  }

  const routine = await getMyRoutine(user);
  const routineClasses = routine
    ? routine.classes.filter((entry) => entry.day === weekday)
    : [];
  const usedRoutineIds = new Set();
  const overrides = [];
  const extras = [];

  for (const sourceClass of sourceClasses) {
    const matched = matchRoutineClass(routineClasses, sourceClass);

    if (matched) {
      const baseId = String(matched._id);
      usedRoutineIds.add(baseId);
      const delta = {};

      if (sourceClass.teacher !== matched.teacher) {
        delta.teacher = sourceClass.teacher;
      }

      if (sourceClass.endTime !== matched.endTime) {
        delta.endTime = sourceClass.endTime;
      }

      if (sourceClass.status !== "Regular") {
        delta.status = sourceClass.status;
      }

      if (sourceClass.room !== matched.room) {
        delta.room = sourceClass.room || "";
      }

      if (sourceClass.meetingPlatform !== matched.meetingPlatform) {
        delta.meetingPlatform = sourceClass.meetingPlatform || "";
      }

      if (sourceClass.meetingLink !== matched.meetingLink) {
        delta.meetingLink = sourceClass.meetingLink || "";
      }

      if ((sourceClass.note || "") !== (matched.note || "")) {
        delta.note = sourceClass.note || "";
      }

      if (Object.keys(delta).length > 0) {
        overrides.push({ routineClassId: baseId, ...delta });
      }
    } else {
      extras.push({
        ...sourceClass,
        _id: undefined,
        day: weekday,
        modified: true,
        sourceRoutineId: null,
      });
    }
  }

  const deletedClassIds = routineClasses
    .filter((entry) => !usedRoutineIds.has(String(entry._id)))
    .map((entry) => String(entry._id));

  const targetRoutine = await getMyRoutineLean(user._id);

  try {
    if (existing) {
      existing.weekday = weekday;
      existing.overrides = overrides;
      existing.extras = extras;
      existing.deletedClassIds = deletedClassIds;
      existing.note = body?.note !== undefined ? String(body.note).trim() : "";
      existing.status = "draft";
      await existing.save();
      return toScheduleView(existing, targetRoutine);
    }

    const created = await DailySchedule.create({
      createdBy: user._id,
      date: targetDate,
      weekday,
      status: "draft",
      sourceRoutineId: routine?._id || null,
      overrides,
      extras,
      deletedClassIds,
    });

    return toScheduleView(created, targetRoutine);
  } catch (error) {
    throw mapMongooseError(error);
  }
};

export const restoreVersion = async (user, scheduleId, historyId) => {
  const schedule = await DailySchedule.findById(scheduleId);

  if (!schedule || schedule.createdBy.toString() !== user._id.toString()) {
    throw new AppError("Schedule not found", 404);
  }

  const version = schedule.history.id(historyId);

  if (!version) {
    throw new AppError("History version not found", 404);
  }

  const routine = await getMyRoutineLean(user._id);
  const snapshot = version.classes.map((entry) => toPlainClass(entry));
  const { overrides, extras, deletedClassIds } = computeScheduleState(
    snapshot,
    routine,
    schedule.weekday,
  );

  schedule.overrides = overrides;
  schedule.extras = extras;
  schedule.deletedClassIds = deletedClassIds;
  schedule.note = version.note || "";
  schedule.status = "draft";

  try {
    await schedule.save();
  } catch (error) {
    throw mapMongooseError(error);
  }

  return toScheduleView(schedule, routine);
};

export const deleteSchedule = async (user, scheduleId) => {
  const schedule = await DailySchedule.findById(scheduleId);

  if (!schedule || schedule.createdBy.toString() !== user._id.toString()) {
    throw new AppError("Schedule not found", 404);
  }

  await schedule.deleteOne();

  return schedule;
};

export default {
  getMyRoutine,
  saveRoutine,
  generateSchedule,
  listSchedules,
  listScheduleHistory,
  getCourseStatistics,
  getSchedule,
  updateSchedule,
  publishSchedule,
  copySchedule,
  restoreVersion,
  deleteSchedule,
  validateClassEntry,
  assertNoDuplicateClasses,
  resolveScheduleClasses,
  computeScheduleState,
};
