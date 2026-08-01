import { CalendarX2, MapPin, Video } from "lucide-react";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  formatTime,
  typeStyles,
  sectionStyles,
  modeStyles,
  classStatusStyles,
} from "./scheduleMeta";

const sortByTime = (classes = []) =>
  [...classes].sort((first, second) =>
    `${first.startTime}`.localeCompare(`${second.startTime}`),
  );

const LocationCell = ({ entry }) => {
  if (entry.status === "Cancelled") {
    return <span className="text-gray-400">—</span>;
  }

  if (entry.classMode === "Online") {
    return (
      <span className="inline-flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
        <Video className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
        {entry.meetingPlatform || "Online"}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
      <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
      {entry.room || "—"}
    </span>
  );
};

const ScheduleClassTable = ({
  classes = [],
  showDay = false,
  showStatus = true,
  showNote = true,
  emptyMessage = "No classes to display",
}) => {
  const sortedClasses = sortByTime(classes);

  if (sortedClasses.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-10 text-center">
        <CalendarX2 className="w-10 h-10 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
      <Table>
        <TableHeader>
          <TableRow>
            {showDay && <TableHead>Day</TableHead>}
            <TableHead>Time</TableHead>
            <TableHead>Course</TableHead>
            <TableHead>Teacher</TableHead>
            <TableHead>Section</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Mode</TableHead>
            <TableHead>Room / Meeting</TableHead>
            {showNote && <TableHead>Note</TableHead>}
            {showStatus && <TableHead>Status</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedClasses.map((entry, index) => (
            <TableRow
              key={entry._id || `${entry.section}-${entry.startTime}-${index}`}
              className={
                entry.status === "Cancelled"
                  ? "opacity-60 bg-red-50/50 dark:bg-red-950/10"
                  : entry.modified
                    ? "bg-amber-50/60 dark:bg-amber-900/10"
                    : undefined
              }
            >
              {showDay && (
                <TableCell className="font-medium">{entry.day}</TableCell>
              )}
              <TableCell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                {formatTime(entry.startTime)} – {formatTime(entry.endTime)}
              </TableCell>
              <TableCell>
                <p className="font-medium text-gray-900 dark:text-white">
                  {entry.courseName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {entry.courseCode}
                </p>
              </TableCell>
              <TableCell className="text-gray-700 dark:text-gray-300">
                {entry.teacher}
              </TableCell>
              <TableCell>
                <Badge
                  className={sectionStyles[entry.section] || sectionStyles.A}
                >
                  {entry.section === "Both" ? "A + B" : entry.section}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={typeStyles[entry.classType] || ""}>
                  {entry.classType}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={modeStyles[entry.classMode] || modeStyles.Physical}>
                  {entry.classMode}
                </Badge>
              </TableCell>
              <TableCell>
                <LocationCell entry={entry} />
              </TableCell>
              {showNote && (
                <TableCell className="max-w-[200px] text-gray-700 dark:text-gray-300">
                  {entry.note || "—"}
                </TableCell>
              )}
              {showStatus && (
                <TableCell>
                  <Badge
                    className={
                      classStatusStyles[entry.status] ||
                      classStatusStyles.Regular
                    }
                  >
                    {entry.status || "Regular"}
                  </Badge>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ScheduleClassTable;
