import {
  Clock,
  Link2,
  MapPin,
  User,
  Video,
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  formatTime,
  typeStyles,
  sectionStyles,
  modeStyles,
  classStatusStyles,
} from "./scheduleMeta";

export const TableSkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, index) => (
      <div
        key={index}
        className="h-24 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse"
      />
    ))}
  </div>
);

export const ClassCard = ({ entry }) => {
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

export default ClassCard;
