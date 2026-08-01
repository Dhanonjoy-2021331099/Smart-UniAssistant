import { useState } from "react";
import { MonitorPlay, School } from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  WEEKDAYS,
  CLASS_TYPES,
  SECTIONS,
  CLASS_MODES,
  MEETING_PLATFORMS,
  CLASS_STATUSES,
  ROOMS_BY_TYPE,
  getWeekdayForDate,
} from "./scheduleMeta";

const selectClassName =
  "flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500";

const defaultDay = () => getWeekdayForDate(new Date()) || "Sunday";

const ClassFormModal = ({
  open,
  onOpenChange,
  initialValues = {},
  includeDay = false,
  includeNote = false,
  includeStatus = false,
  defaultDate,
  onSubmit,
  loading = false,
  title = "Add Class",
}) => {
  const initialMode = initialValues.classMode || "Physical";

  const [formData, setFormData] = useState(() => ({
    day: initialValues.day || defaultDate || defaultDay(),
    startTime: initialValues.startTime || "",
    endTime: initialValues.endTime || "",
    courseCode: initialValues.courseCode || "",
    courseName: initialValues.courseName || "",
    teacher: initialValues.teacher || "",
    classType: initialValues.classType || "Theory",
    section: initialValues.section || "A",
    classMode: initialMode,
    room:
      initialValues.room ||
      ROOMS_BY_TYPE[initialValues.classType || "Theory"][0],
    meetingPlatform: initialValues.meetingPlatform || "Google Meet",
    meetingLink: initialValues.meetingLink || "",
    note: initialValues.note || "",
    status: initialValues.status || "Regular",
  }));
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));

    if (field === "classType") {
      const rooms = ROOMS_BY_TYPE[value] || [];
      setFormData((prev) => ({
        ...prev,
        classType: value,
        room: rooms.includes(prev.room) ? prev.room : rooms[0],
      }));
    }

    if (field === "classMode") {
      setFormData((prev) => ({
        ...prev,
        classMode: value,
        ...(value === "Online"
          ? { meetingPlatform: prev.meetingPlatform || "Google Meet" }
          : { room: prev.room || ROOMS_BY_TYPE[prev.classType][0] }),
      }));
    }
  };

  const validate = () => {
    const nextErrors = {};

    if (!formData.startTime) {
      nextErrors.startTime = "Start time is required";
    }

    if (!formData.endTime) {
      nextErrors.endTime = "End time is required";
    }

    if (
      formData.endTime &&
      formData.startTime &&
      formData.endTime <= formData.startTime
    ) {
      nextErrors.endTime = "End time must be after start time";
    }

    if (!formData.courseCode.trim()) {
      nextErrors.courseCode = "Course code is required";
    }

    if (!formData.courseName.trim()) {
      nextErrors.courseName = "Course name is required";
    }

    if (!formData.teacher.trim()) {
      nextErrors.teacher = "Teacher is required";
    }

    if (formData.classMode === "Physical" && !formData.room) {
      nextErrors.room = "Room is required for physical classes";
    }

    if (formData.classMode === "Online") {
      if (!formData.meetingPlatform) {
        nextErrors.meetingPlatform = "Meeting platform is required";
      }

      if (!formData.meetingLink.trim()) {
        nextErrors.meetingLink = "Meeting link is required";
      } else if (!/^https?:\/\/.+/i.test(formData.meetingLink.trim())) {
        nextErrors.meetingLink = "Meeting link must start with http(s)://";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    const payload = {
      ...formData,
      note: formData.note.trim(),
      room: formData.classMode === "Physical" ? formData.room : "",
      meetingPlatform:
        formData.classMode === "Online" ? formData.meetingPlatform : "",
      meetingLink:
        formData.classMode === "Online" ? formData.meetingLink.trim() : "",
    };

    onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Fill in the class details below.</DialogDescription>
        </DialogHeader>

        <form className="space-y-5" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {includeDay && (
              <div className="space-y-2">
                <Label htmlFor="class-day">Day</Label>
                <select
                  id="class-day"
                  value={formData.day}
                  onChange={(e) => handleChange("day", e.target.value)}
                  className={selectClassName}
                >
                  {WEEKDAYS.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="class-start-time">Start Time</Label>
              <Input
                id="class-start-time"
                type="time"
                value={formData.startTime}
                onChange={(e) => handleChange("startTime", e.target.value)}
              />
              {errors.startTime && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.startTime}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="class-end-time">End Time</Label>
              <Input
                id="class-end-time"
                type="time"
                value={formData.endTime}
                onChange={(e) => handleChange("endTime", e.target.value)}
              />
              {errors.endTime && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.endTime}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="class-course-code">Course Code</Label>
              <Input
                id="class-course-code"
                value={formData.courseCode}
                onChange={(e) => handleChange("courseCode", e.target.value)}
                placeholder="e.g. CSE-3103"
              />
              {errors.courseCode && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.courseCode}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="class-course-name">Course Name</Label>
              <Input
                id="class-course-name"
                value={formData.courseName}
                onChange={(e) => handleChange("courseName", e.target.value)}
                placeholder="e.g. Database Management Systems"
              />
              {errors.courseName && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.courseName}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="class-teacher">Teacher</Label>
              <Input
                id="class-teacher"
                value={formData.teacher}
                onChange={(e) => handleChange("teacher", e.target.value)}
                placeholder="Teacher name"
              />
              {errors.teacher && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.teacher}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="class-type">Class Type</Label>
              <select
                id="class-type"
                value={formData.classType}
                onChange={(e) => handleChange("classType", e.target.value)}
                className={selectClassName}
              >
                {CLASS_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="class-section">Section</Label>
              <select
                id="class-section"
                value={formData.section}
                onChange={(e) => handleChange("section", e.target.value)}
                className={selectClassName}
              >
                {SECTIONS.map((section) => (
                  <option key={section} value={section}>
                    {section === "Both" ? "A + B" : `Section ${section}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Class Mode</Label>
            <div className="grid grid-cols-2 gap-3">
              {CLASS_MODES.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleChange("classMode", mode)}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                    formData.classMode === mode
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      : "border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900"
                  }`}
                >
                  {mode === "Physical" ? (
                    <School className="w-4 h-4" />
                  ) : (
                    <MonitorPlay className="w-4 h-4" />
                  )}
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {formData.classMode === "Physical" ? (
            <div className="space-y-2">
              <Label htmlFor="class-room">Room</Label>
              <select
                id="class-room"
                value={formData.room}
                onChange={(e) => handleChange("room", e.target.value)}
                className={selectClassName}
              >
                {(ROOMS_BY_TYPE[formData.classType] || []).map((room) => (
                  <option key={room} value={room}>
                    {room}
                  </option>
                ))}
              </select>
              {errors.room && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.room}
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Rooms available for {formData.classType} classes.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="class-meeting-platform">Meeting Platform</Label>
                <select
                  id="class-meeting-platform"
                  value={formData.meetingPlatform}
                  onChange={(e) =>
                    handleChange("meetingPlatform", e.target.value)
                  }
                  className={selectClassName}
                >
                  {MEETING_PLATFORMS.map((platform) => (
                    <option key={platform} value={platform}>
                      {platform}
                    </option>
                  ))}
                </select>
                {errors.meetingPlatform && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.meetingPlatform}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="class-meeting-link">Meeting Link</Label>
                <Input
                  id="class-meeting-link"
                  value={formData.meetingLink}
                  onChange={(e) => handleChange("meetingLink", e.target.value)}
                  placeholder="https://meet.google.com/..."
                />
                {errors.meetingLink && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.meetingLink}
                  </p>
                )}
              </div>
            </div>
          )}

          {includeStatus && (
            <div className="space-y-2">
              <Label htmlFor="class-status">Status</Label>
              <select
                id="class-status"
                value={formData.status}
                onChange={(e) => handleChange("status", e.target.value)}
                className={selectClassName}
              >
                {CLASS_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          )}

          {includeNote && (
            <div className="space-y-2">
              <Label htmlFor="class-note">Optional Note</Label>
              <Input
                id="class-note"
                value={formData.note}
                onChange={(e) => handleChange("note", e.target.value)}
                placeholder="e.g. Bring lab manual"
              />
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange?.(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Class"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ClassFormModal;
