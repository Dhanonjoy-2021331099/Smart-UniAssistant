export const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const CLASS_TYPES = ["Theory", "Lab"];

export const SECTIONS = ["A", "B", "Both"];

export const CLASS_MODES = ["Physical", "Online"];

export const MEETING_PLATFORMS = [
  "Google Meet",
  "Zoom",
  "Microsoft Teams",
  "Others",
];

export const CLASS_STATUSES = ["Regular", "Cancelled", "Rescheduled", "Extra Class"];

export const ROOMS_BY_TYPE = {
  Theory: ["Gallery 1", "Gallery 2", "Room 630", "Room 730"],
  Lab: ["Room 303", "Room 304", "Room 629", "Room 729"],
};

export const statusStyles = {
  draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  published:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
};

export const typeStyles = {
  Theory: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  Lab: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
};

export const sectionStyles = {
  A: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  B: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  Both: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300",
};

export const classStatusStyles = {
  Regular: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  Cancelled: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  Rescheduled:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  "Extra Class":
    "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
};

export const modeStyles = {
  Physical: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  Online: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
};

export const toDateKey = (value) => {
  if (!value) {
    return "";
  }

  const date = typeof value === "string" ? new Date(value) : value;

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const getWeekdayForDate = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return WEEKDAYS[date.getDay()] || "";
};

export const formatScheduleDate = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatTime = (value) => {
  if (!value) {
    return "—";
  }

  const [hours, minutes] = value.split(":");

  if (!hours || minutes === undefined) {
    return value;
  }

  const hour = Number(hours);
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 === 0 ? 12 : hour % 12;

  return `${display}:${minutes} ${suffix}`;
};

export const addDaysToKey = (value, days) => {
  if (!value) {
    return "";
  }

  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + days);

  return toDateKey(date);
};

export const scheduleEntryKey = (entry) =>
  `${entry.section}|${entry.startTime}|${entry.courseCode}`;

export const diffScheduleVersions = (before = [], after = []) => {
  const beforeByKey = new Map(before.map((entry) => [scheduleEntryKey(entry), entry]));
  const afterByKey = new Map(after.map((entry) => [scheduleEntryKey(entry), entry]));

  const changes = [];

  for (const entry of after) {
    const key = scheduleEntryKey(entry);
    const previous = beforeByKey.get(key);

    if (!previous) {
      changes.push({
        type: "added",
        entry,
        fields: [],
      });
      continue;
    }

    const fields = [];

    if (entry.startTime !== previous.startTime || entry.endTime !== previous.endTime) {
      fields.push("time");
    }

    if (entry.teacher !== previous.teacher) {
      fields.push("teacher");
    }

    if (entry.room !== previous.room) {
      fields.push("room");
    }

    if (
      entry.meetingLink !== previous.meetingLink ||
      entry.meetingPlatform !== previous.meetingPlatform
    ) {
      fields.push("meeting");
    }

    if (entry.status !== previous.status) {
      fields.push("status");
    }

    if (entry.note !== previous.note) {
      fields.push("note");
    }

    if (fields.length > 0) {
      changes.push({
        type: "changed",
        entry,
        fields,
      });
    }
  }

  for (const entry of before) {
    const key = scheduleEntryKey(entry);

    if (!afterByKey.has(key)) {
      changes.push({
        type: "removed",
        entry,
        fields: [],
      });
    }
  }

  return changes;
};
