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

export const SCHEDULE_STATUSES = ["draft", "published"];

export const isValidMeetingLink = (value) => {
  if (typeof value !== "string" || !value.trim()) {
    return false;
  }

  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export const ROOMS_BY_TYPE = {
  Theory: ["Gallery 1", "Gallery 2", "Room 630", "Room 730"],
  Lab: ["Room 303", "Room 304", "Room 629", "Room 729"],
};

export const ALL_ROOMS = Object.values(ROOMS_BY_TYPE).flat();

export const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const isValidRoom = (classType, room) => {
  const rooms = ROOMS_BY_TYPE[classType];
  return Array.isArray(rooms) && rooms.includes(room);
};

export const isValidTime = (value) =>
  typeof value === "string" && TIME_REGEX.test(value);

export const isEndAfterStart = (startTime, endTime) => {
  if (!isValidTime(startTime) || !isValidTime(endTime)) {
    return false;
  }

  return endTime > startTime;
};

export const getWeekdayForDate = (date) => {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return WEEKDAYS[parsed.getDay()];
};

export const formatDateKey = (date) => {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export default {
  WEEKDAYS,
  CLASS_TYPES,
  SECTIONS,
  CLASS_MODES,
  MEETING_PLATFORMS,
  CLASS_STATUSES,
  SCHEDULE_STATUSES,
  ROOMS_BY_TYPE,
  ALL_ROOMS,
  isValidRoom,
  isValidTime,
  isEndAfterStart,
  isValidMeetingLink,
  getWeekdayForDate,
  formatDateKey,
};
