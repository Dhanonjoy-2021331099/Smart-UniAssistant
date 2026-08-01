import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarClock,
  CalendarDays,
  Clock,
  Link2,
  MapPin,
  User,
  Video,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import {
  getWeekdayForDate,
  formatScheduleDate,
  formatTime,
  toDateKey,
  addDaysToKey,
  typeStyles,
  sectionStyles,
  modeStyles,
  classStatusStyles,
} from "../../components/schedule/scheduleMeta";
import { fetchSchedules } from "../../services/schedule.service";

const todayKey = toDateKey(new Date());
const tomorrowKey = addDaysToKey(todayKey, 1);

const TableSkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, index) => (
      <div
        key={index}
        className="h-24 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse"
      />
    ))}
  </div>
);

const ClassCard = ({ entry }) => {
  const isCancelled = entry.status === "Cancelled";
  const isOnline = entry.classMode === "Online";

  const openMeeting = () => {
    if (entry.meetingLink) {
      window.open(entry.meetingLink, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        isCancelled
          ? "border-red-200 dark:border-red-900 bg-red-50/40 dark:bg-red-950/10"
          : entry.modified
            ? "border-amber-200 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-900/10"
            : "border-gray-200 dark:border-gray-800"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
            {entry.courseName}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {entry.courseCode}
          </p>
        </div>
        <Badge
          className={
            classStatusStyles[entry.status] || classStatusStyles.Regular
          }
        >
          {entry.status || "Regular"}
        </Badge>
      </div>

      <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300 mt-3">
        <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <span className="font-medium">
          {formatTime(entry.startTime)} – {formatTime(entry.endTime)}
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 mt-1.5">
        <User className="w-4 h-4" />
        {entry.teacher}
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-3">
        <Badge className={sectionStyles[entry.section] || sectionStyles.A}>
          {entry.section === "Both" ? "Section A + B" : `Section ${entry.section}`}
        </Badge>
        <Badge className={typeStyles[entry.classType] || ""}>
          {entry.classType}
        </Badge>
        <Badge className={modeStyles[entry.classMode] || modeStyles.Physical}>
          {entry.classMode}
        </Badge>
      </div>

      <div className="mt-3">
        {isCancelled ? (
          <p className="text-sm text-red-600 dark:text-red-400 font-medium">
            This class has been cancelled.
          </p>
        ) : isOnline ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 dark:border-gray-800 p-2.5">
            <span className="inline-flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
              <Video className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              {entry.meetingPlatform || "Online"}
            </span>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={openMeeting}
            >
              <Link2 className="w-4 h-4 mr-1" />
              Join Class
            </Button>
          </div>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
            <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            {entry.room || "Room to be announced"}
          </span>
        )}
      </div>

      {entry.note && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 border-t border-gray-100 dark:border-gray-800 pt-2">
          {entry.note}
        </p>
      )}
    </div>
  );
};

const DayPanel = ({ dateKey, title }) => {
  const weekday = getWeekdayForDate(dateKey);

  const {
    data,
    isPending: loading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["student-schedule", dateKey],
    queryFn: () =>
      fetchSchedules({
        date: dateKey,
        status: "published",
        limit: 1,
      }),
  });

  const schedule = data?.schedules?.[0] || null;
  const sortedClasses = schedule
    ? [...schedule.classes].sort((first, second) =>
        `${first.startTime}`.localeCompare(`${second.startTime}`),
      )
    : [];

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatScheduleDate(dateKey)} · {weekday}
            </p>
          </div>
          {schedule && (
            <Badge className="bg-emerald-600 text-white">Published</Badge>
          )}
        </div>

        {loading ? (
          <TableSkeleton />
        ) : isError ? (
          <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 p-6 text-center">
            <p className="text-red-700 dark:text-red-300 mb-4">
              {error?.response?.data?.error ||
                error?.message ||
                "Failed to load schedule"}
            </p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </div>
        ) : schedule && sortedClasses.length > 0 ? (
          <div className="space-y-3">
            {sortedClasses.map((entry, index) => (
              <ClassCard
                key={entry._id || `${entry.section}-${entry.startTime}-${index}`}
                entry={entry}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
            <CalendarClock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No schedule published yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Your CR has not published a schedule for{" "}
              {formatScheduleDate(dateKey)} yet. Check back later.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const StudentSchedule = () => {
  const [tab, setTab] = useState("today");

  return (
    <div className="space-y-6" data-testid="student-schedule-page">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Class Schedule
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Today&apos;s and tomorrow&apos;s classes, published by your CR.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant={tab === "today" ? "default" : "outline"}
          onClick={() => setTab("today")}
        >
          <CalendarDays className="w-4 h-4 mr-2" />
          Today
        </Button>
        <Button
          variant={tab === "tomorrow" ? "default" : "outline"}
          onClick={() => setTab("tomorrow")}
        >
          <CalendarClock className="w-4 h-4 mr-2" />
          Tomorrow
        </Button>
      </div>

      {tab === "today" ? (
        <DayPanel dateKey={todayKey} title="Today's Schedule" />
      ) : (
        <DayPanel dateKey={tomorrowKey} title="Tomorrow's Schedule" />
      )}
    </div>
  );
};

export default StudentSchedule;
