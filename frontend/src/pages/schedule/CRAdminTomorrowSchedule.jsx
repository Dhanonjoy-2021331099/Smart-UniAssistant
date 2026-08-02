import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Ban,
  CalendarClock,
  CalendarSearch,
  Copy,
  Eye,
  FileEdit,
  GitCompareArrows,
  History,
  Info,
  Plus,
  Save,
  Search,
  Send,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent, CardTitle } from "../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import DatePicker from "../../components/notices/DatePicker";
import ClassFormModal from "../../components/schedule/ClassFormModal";
import ScheduleClassTable from "../../components/schedule/ScheduleClassTable";
import {
  SECTIONS,
  MEETING_PLATFORMS,
  ROOMS_BY_TYPE,
  getWeekdayForDate,
  formatScheduleDate,
  formatTime,
  toDateKey,
  addDaysToKey,
  typeStyles,
  sectionStyles,
  modeStyles,
  classStatusStyles,
  diffScheduleVersions,
} from "../../components/schedule/scheduleMeta";
import {
  copySchedule,
  fetchSchedules,
  generateSchedule,
  publishSchedule,
  restoreScheduleVersion,
  updateSchedule,
} from "../../services/schedule.service";

const selectClassName =
  "h-8 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500";

const todayKey = toDateKey(new Date());

const diffDays = (first, second) => {
  const firstDate = new Date(`${first}T00:00:00`);
  const secondDate = new Date(`${second}T00:00:00`);

  return Math.round((firstDate - secondDate) / 86400000);
};

const sortByTime = (classes = []) =>
  [...classes].sort((first, second) =>
    `${first.startTime}`.localeCompare(`${second.startTime}`),
  );

const TableSkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 6 }).map((_, index) => (
      <div
        key={index}
        className="h-12 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse"
      />
    ))}
  </div>
);

const StatusBadge = ({ status }) => (
  <Badge className={classStatusStyles[status] || classStatusStyles.Regular}>
    {status || "Regular"}
  </Badge>
);

const CRAdminTomorrowSchedule = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState(() => addDaysToKey(todayKey, 1));
  const [schedule, setSchedule] = useState(null);
  const [classes, setClasses] = useState([]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [generateError, setGenerateError] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [courseSearch, setCourseSearch] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [copySearch, setCopySearch] = useState("");
  const [classModalOpen, setClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [duplicateTarget, setDuplicateTarget] = useState(null);
  const [duplicateDate, setDuplicateDate] = useState(() => addDaysToKey(todayKey, 2));
  const [viewChangesTarget, setViewChangesTarget] = useState(null);

  const weekday = getWeekdayForDate(selectedDate);

  const {
    data: publishedData,
    refetch: refetchPublished,
  } = useQuery({
    queryKey: ["published-schedules"],
    queryFn: () => fetchSchedules({ status: "published", limit: 100 }),
  });

  const publishedSchedules = useMemo(
    () => publishedData?.schedules || [],
    [publishedData],
  );

  useEffect(() => {
    let cancelled = false;

    generateSchedule(selectedDate)
      .then((result) => {
        if (cancelled) {
          return;
        }

        setSchedule(result);
        setClasses(result.classes || []);
        setNote(result.note || "");
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        setSchedule(null);
        setClasses([]);
        setNote("");
        setGenerateError(
          error.response?.data?.error ||
            error.message ||
            "Failed to load schedule",
        );
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateSchedule(schedule._id, { classes, note, status: "draft" }),
    onSuccess: (result) => {
      setSchedule(result);
      setClasses(result.classes || []);
      toast.success("Schedule saved as draft");
    },
    onError: (err) =>
      toast.error(err.response?.data?.error || "Failed to save schedule"),
  });

  const publishMutation = useMutation({
    mutationFn: () => publishSchedule(schedule._id),
    onSuccess: (result) => {
      setSchedule(result);
      setClasses(result.classes || []);
      toast.success("Schedule published successfully");
      queryClient.invalidateQueries({ queryKey: ["published-schedules"] });
    },
    onError: (err) =>
      toast.error(err.response?.data?.error || "Failed to publish schedule"),
  });

  const copyMutation = useMutation({
    mutationFn: ({ sourceId, targetDate, historyId }) =>
      copySchedule(sourceId, targetDate, historyId),
    onSuccess: async (result) => {
      toast.success("Schedule copied successfully");
      setCopyOpen(false);
      setDuplicateTarget(null);
      await refetchPublished();

      const sameDate = schedule && toDateKey(result.date) === selectedDate;

      if (sameDate) {
        setSchedule(result);
        setClasses(result.classes || []);
        setNote(result.note || "");
      } else {
        await loadSchedule(selectedDate);
      }
    },
    onError: (err) =>
      toast.error(err.response?.data?.error || "Failed to copy schedule"),
  });

  const restoreMutation = useMutation({
    mutationFn: ({ historyId }) =>
      restoreScheduleVersion(schedule._id, historyId),
    onSuccess: async (result) => {
      setSchedule(result);
      setClasses(result.classes || []);
      setNote(result.note || "");
      setHistoryOpen(false);
      toast.success("Previous version restored as draft");
    },
    onError: (err) =>
      toast.error(err.response?.data?.error || "Failed to restore version"),
  });

  const loadSchedule = async (date) => {
    setLoading(true);
    setGenerateError("");

    try {
      const result = await generateSchedule(date);
      setSchedule(result);
      setClasses(result.classes || []);
      setNote(result.note || "");
    } catch (error) {
      setSchedule(null);
      setClasses([]);
      setNote("");
      setGenerateError(
        error.response?.data?.error || error.message || "Failed to load schedule",
      );
    } finally {
      setLoading(false);
    }
  };

  const updateClass = (index, patch) => {
    setClasses((current) =>
      current.map((entry, currentIndex) => {
        if (currentIndex !== index) {
          return entry;
        }

        const next = { ...entry, ...patch };
        const timeChanged =
          (patch.startTime !== undefined && patch.startTime !== entry.startTime) ||
          (patch.endTime !== undefined && patch.endTime !== entry.endTime);
        const roomChanged =
          patch.room !== undefined &&
          patch.room !== entry.room &&
          entry.classMode === "Physical";

        if (
          (timeChanged || roomChanged) &&
          entry.status === "Regular"
        ) {
          next.status = "Rescheduled";
        }

        next.modified = true;

        return next;
      }),
    );
  };

  const toggleCancel = (index) => {
    setClasses((current) =>
      current.map((entry, currentIndex) =>
        currentIndex === index
          ? {
              ...entry,
              status:
                entry.status === "Cancelled" ? "Regular" : "Cancelled",
              modified: true,
            }
          : entry,
      ),
    );
  };

  const markRescheduled = (index) => {
    setClasses((current) =>
      current.map((entry, currentIndex) =>
        currentIndex === index
          ? {
              ...entry,
              status: "Rescheduled",
              modified: true,
            }
          : entry,
      ),
    );
  };

  const openAddClassModal = () => {
    setEditingClass(null);
    setClassModalOpen(true);
  };

  const openEditClassModal = (entry, index) => {
    setEditingClass({ entry, index });
    setClassModalOpen(true);
  };

  const handleClassSubmit = (entry) => {
    if (editingClass) {
      setClasses((current) =>
        current.map((item, index) =>
          index === editingClass.index
            ? { ...item, ...entry, modified: true }
            : item,
        ),
      );
    } else {
      setClasses((current) => [
        ...current,
        {
          ...entry,
          day: weekday,
          status: "Extra Class",
          modified: true,
          sourceRoutineId: null,
        },
      ]);
    }

    setClassModalOpen(false);
    setEditingClass(null);
  };

  const handleDelete = () => {
    if (deleteTarget === null) {
      return;
    }

    setClasses((current) =>
      current.filter((_, index) => index !== deleteTarget),
    );
    setDeleteTarget(null);
  };

  const findCopySource = (mode) => {
    const candidates = publishedSchedules
      .filter((item) => item.date && toDateKey(item.date) < todayKey)
      .map((item) => ({ ...item, dateKey: toDateKey(item.date) }));

    if (mode === "yesterday") {
      return candidates.sort((first, second) =>
        second.dateKey.localeCompare(first.dateKey),
      )[0];
    }

    const targetKey = addDaysToKey(todayKey, -7);

    return candidates.sort(
      (first, second) =>
        diffDays(first.dateKey, targetKey) - diffDays(second.dateKey, targetKey),
    )[0];
  };

  const handleQuickCopy = (mode) => {
    const source = findCopySource(mode);

    if (!source) {
      toast.error(
        mode === "yesterday"
          ? "No previously published schedule found to copy"
          : "No published schedule from last week found to copy",
      );
      return;
    }

    copyMutation.mutate({ sourceId: source._id, targetDate: selectedDate });
  };

  const filteredCopySchedules = useMemo(() => {
    const query = copySearch.trim().toLowerCase();

    if (!query) {
      return publishedSchedules;
    }

    return publishedSchedules.filter((item) => {
      const label = `${formatScheduleDate(item.date)} ${item.weekday || ""}`.toLowerCase();
      return label.includes(query);
    });
  }, [publishedSchedules, copySearch]);

  const displayedClasses = useMemo(() => {
    const filtered = classes.filter((entry) => {
      const matchesSection = !sectionFilter || entry.section === sectionFilter;
      const matchesCourse =
        !courseSearch.trim() ||
        entry.courseCode.toLowerCase().includes(courseSearch.trim().toLowerCase()) ||
        entry.courseName.toLowerCase().includes(courseSearch.trim().toLowerCase());

      return matchesSection && matchesCourse;
    });

    return sortByTime(filtered);
  }, [classes, sectionFilter, courseSearch]);

  const viewChangesVersion = useMemo(() => {
    if (!viewChangesTarget || !schedule) {
      return null;
    }

    const index = schedule.history.findIndex(
      (version) => version._id === viewChangesTarget,
    );

    if (index === -1) {
      return null;
    }

    const current = schedule.history[index];
    const previous = index > 0 ? schedule.history[index - 1].classes : [];

    return {
      current,
      changes: diffScheduleVersions(previous, current.classes),
    };
  }, [viewChangesTarget, schedule]);

  const hasRoutineError = generateError.toLowerCase().includes("weekly routine");
  const noClassesForDay = generateError.toLowerCase().includes("no classes found");

  return (
    <div className="space-y-6" data-testid="tomorrow-schedule-page">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Tomorrow&apos;s Schedule
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Pick a date. Classes load automatically from your base routine — edit
          only what changed, then preview, save, or publish.
        </p>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="w-56">
                <DatePicker
                  value={selectedDate}
                  onChange={(date) => {
                    setSelectedDate(date);
                    setLoading(true);
                    setGenerateError("");
                  }}
                  minDate={todayKey}
                  placeholder="Select date"
                />
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-600 text-white">{weekday || "—"}</Badge>
                {schedule && (
                  <Badge
                    className={
                      schedule.status === "published"
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-500 text-white"
                    }
                  >
                    {schedule.status === "published" ? "Published" : "Draft"}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setCopyOpen(true)}
                disabled={copyMutation.isPending}
              >
                <CalendarSearch className="w-4 h-4 mr-2" />
                Copy From Published Date
              </Button>
              <Button variant="outline" onClick={() => setHistoryOpen(true)}>
                <History className="w-4 h-4 mr-2" />
                History
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                placeholder="Filter by course code or name..."
                className="pl-10"
              />
            </div>
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="h-10 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Filter by section"
            >
              <option value="">All Sections</option>
              {SECTIONS.map((section) => (
                <option key={section} value={section}>
                  {section === "Both" ? "A + B" : `Section ${section}`}
                </option>
              ))}
            </select>
            <Button variant="outline" onClick={openAddClassModal}>
              <Plus className="w-4 h-4 mr-2" />
              Add Extra Class
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="p-4">
            <TableSkeleton />
          </CardContent>
        </Card>
      ) : generateError ? (
        <Card>
          <CardContent className="p-4">
            <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-900/20 p-8 text-center">
              <Info className="w-10 h-10 text-amber-500 mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {hasRoutineError
                  ? "Weekly routine not found"
                  : noClassesForDay
                    ? `No classes on ${weekday}`
                    : "Could not load schedule"}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {hasRoutineError
                  ? "Create your base weekly routine first so tomorrow's classes can be loaded automatically."
                  : noClassesForDay
                    ? `Your weekly routine has no classes for ${weekday}. Add classes for this day or pick another date.`
                    : generateError}
              </p>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => navigate("/cradmin/schedule/base")}
              >
                Go to Base Weekly Routine
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : displayedClasses.length === 0 ? (
        <Card>
          <CardContent className="p-4">
            <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
              <CalendarClock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No classes match your filters
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Try adjusting your filters or add an extra class.
              </p>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={openAddClassModal}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Extra Class
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-lg">
                  Classes for {formatScheduleDate(selectedDate)}
                </CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Amber rows are modified. Cancelled classes show a red badge.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setPreviewOpen(true)}>
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                <Button
                  variant="outline"
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saveMutation.isPending ? "Saving..." : "Save Draft"}
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => publishMutation.mutate()}
                  disabled={publishMutation.isPending || classes.length === 0}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {publishMutation.isPending ? "Publishing..." : "Publish Schedule"}
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Room / Meeting</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedClasses.map((entry) => {
                    const originalIndex = classes.findIndex(
                      (item) => item === entry,
                    );
                    const isCancelled = entry.status === "Cancelled";

                    return (
                      <TableRow
                        key={entry._id || `${entry.section}-${entry.startTime}`}
                        className={
                          isCancelled
                            ? "bg-red-50/60 dark:bg-red-950/20"
                            : entry.modified
                              ? "bg-amber-50/70 dark:bg-amber-900/10"
                              : undefined
                        }
                      >
                        <TableCell className="whitespace-nowrap">
                          <div className="space-y-1.5 w-28">
                            <Input
                              type="time"
                              value={entry.startTime}
                              onChange={(e) =>
                                updateClass(originalIndex, {
                                  startTime: e.target.value,
                                })
                              }
                              className="h-8 text-xs px-2"
                            />
                            <Input
                              type="time"
                              value={entry.endTime}
                              onChange={(e) =>
                                updateClass(originalIndex, {
                                  endTime: e.target.value,
                                })
                              }
                              className="h-8 text-xs px-2"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[180px]">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {entry.courseName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {entry.courseCode}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={entry.teacher}
                            onChange={(e) =>
                              updateClass(originalIndex, {
                                teacher: e.target.value,
                              })
                            }
                            className="h-8 w-36 text-xs px-2"
                            placeholder="Teacher"
                          />
                        </TableCell>
                        <TableCell>
                          {entry.classMode === "Online" ? (
                            <div className="space-y-1.5 w-52">
                              <select
                                value={entry.meetingPlatform || ""}
                                onChange={(e) =>
                                  updateClass(originalIndex, {
                                    meetingPlatform: e.target.value,
                                  })
                                }
                                className={selectClassName}
                                aria-label={`Platform for ${entry.courseCode}`}
                              >
                                {MEETING_PLATFORMS.map((platform) => (
                                  <option key={platform} value={platform}>
                                    {platform}
                                  </option>
                                ))}
                              </select>
                              <Input
                                value={entry.meetingLink || ""}
                                onChange={(e) =>
                                  updateClass(originalIndex, {
                                    meetingLink: e.target.value,
                                  })
                                }
                                className="h-8 w-full text-xs px-2"
                                placeholder="https://..."
                              />
                            </div>
                          ) : (
                            <select
                              value={entry.room || ""}
                              onChange={(e) =>
                                updateClass(originalIndex, {
                                  room: e.target.value,
                                })
                              }
                              className={selectClassName}
                              aria-label={`Room for ${entry.courseCode}`}
                            >
                              {(ROOMS_BY_TYPE[entry.classType] || []).map((room) => (
                                <option key={room} value={room}>
                                  {room}
                                </option>
                              ))}
                            </select>
                          )}
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
                          <StatusBadge status={entry.status} />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={entry.note || ""}
                            onChange={(e) =>
                              updateClass(originalIndex, {
                                note: e.target.value,
                              })
                            }
                            className="h-8 w-36 text-xs px-2"
                            placeholder="Optional note"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Edit"
                              onClick={() => openEditClassModal(entry, originalIndex)}
                            >
                              <FileEdit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Mark as rescheduled"
                              onClick={() => markRescheduled(originalIndex)}
                              disabled={isCancelled}
                            >
                              <CalendarClock className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title={
                                isCancelled ? "Reinstate class" : "Cancel class"
                              }
                              onClick={() => toggleCancel(originalIndex)}
                            >
                              <Ban className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700"
                              title="Delete class"
                              onClick={() => setDeleteTarget(originalIndex)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Schedule Note (optional)
              </span>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Labs run in the afternoon from this week."
              />
            </div>
          </CardContent>
        </Card>
      )}

      <ClassFormModal
        open={classModalOpen}
        onOpenChange={setClassModalOpen}
        initialValues={editingClass?.entry || {}}
        includeNote
        includeStatus={!editingClass}
        defaultDate={weekday}
        onSubmit={handleClassSubmit}
        title={editingClass ? "Edit Class" : "Add Extra Class"}
      />

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview Schedule</DialogTitle>
            <DialogDescription>
              {formatScheduleDate(selectedDate)} · {weekday}
            </DialogDescription>
          </DialogHeader>
          <ScheduleClassTable classes={classes} />
        </DialogContent>
      </Dialog>

      <Dialog open={copyOpen} onOpenChange={setCopyOpen}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Copy From Published Date</DialogTitle>
            <DialogDescription>
              Pick a previously published day to copy into{" "}
              {formatScheduleDate(selectedDate)} ({weekday}).
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickCopy("yesterday")}
              disabled={copyMutation.isPending}
            >
              <Copy className="w-4 h-4 mr-1" />
              Copy Yesterday
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickCopy("lastWeek")}
              disabled={copyMutation.isPending}
            >
              <Copy className="w-4 h-4 mr-1" />
              Copy Last Week
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={copySearch}
              onChange={(e) => setCopySearch(e.target.value)}
              placeholder="Search published days (date or weekday)..."
              className="pl-10"
            />
          </div>

          {publishedSchedules.length === 0 ? (
            <p className="text-center text-gray-500 py-6">
              No published schedules yet.
            </p>
          ) : filteredCopySchedules.length === 0 ? (
            <p className="text-center text-gray-500 py-6">
              No published days match your search.
            </p>
          ) : (
            <div className="space-y-2">
              {filteredCopySchedules.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 dark:border-gray-800 p-3"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatScheduleDate(item.date)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {item.weekday} · {item.classes.length} classes
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyMutation.mutate({
                        sourceId: item._id,
                        targetDate: selectedDate,
                      })
                    }
                    disabled={copyMutation.isPending}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </Button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule History</DialogTitle>
            <DialogDescription>
              Every published version is kept. Restore, duplicate, or view the
              changes of any version.
            </DialogDescription>
          </DialogHeader>

          {!schedule || schedule.history.length === 0 ? (
            <p className="text-center text-gray-500 py-6">
              No published versions yet.
            </p>
          ) : (
            <div className="space-y-3">
              {[...schedule.history].reverse().map((version) => (
                <div
                  key={version._id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-gray-200 dark:border-gray-800 p-3"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Version {version.version}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Published {formatScheduleDate(version.publishedAt)} ·{" "}
                      {version.classes.length} classes
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewChangesTarget(version._id)}
                    >
                      <GitCompareArrows className="w-4 h-4 mr-1" />
                      Changes
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDuplicateTarget(version._id);
                        setDuplicateDate(addDaysToKey(todayKey, 2));
                      }}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Duplicate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        restoreMutation.mutate({ historyId: version._id })
                      }
                      disabled={restoreMutation.isPending}
                    >
                      Restore
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={duplicateTarget !== null}
        onOpenChange={(value) => !value && setDuplicateTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Version</DialogTitle>
            <DialogDescription>
              Copy this published version into another date as a draft.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="w-56">
              <DatePicker
                value={duplicateDate}
                onChange={setDuplicateDate}
                minDate={todayKey}
                placeholder="Select target date"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDuplicateTarget(null)}>
                Cancel
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() =>
                  copyMutation.mutate({
                    sourceId: schedule._id,
                    targetDate: duplicateDate,
                    historyId: duplicateTarget,
                  })
                }
                disabled={copyMutation.isPending}
              >
                {copyMutation.isPending ? "Copying..." : "Duplicate Here"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={viewChangesTarget !== null}
        onOpenChange={(value) => !value && setViewChangesTarget(null)}
      >
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Version Changes</DialogTitle>
            <DialogDescription>
              {viewChangesVersion
                ? `Changes introduced in Version ${viewChangesVersion.current.version}`
                : ""}
            </DialogDescription>
          </DialogHeader>

          {!viewChangesVersion ? (
            <p className="text-center text-gray-500 py-6">
              Unable to load changes.
            </p>
          ) : viewChangesVersion.changes.length === 0 ? (
            <p className="text-center text-gray-500 py-6">
              No changes recorded for this version.
            </p>
          ) : (
            <div className="space-y-3">
              {viewChangesVersion.changes.map((change, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-gray-200 dark:border-gray-800 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {change.entry.courseCode} · {change.entry.courseName}
                    </p>
                    <Badge
                      className={
                        change.type === "added"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                          : change.type === "removed"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                      }
                    >
                      {change.type === "added"
                        ? "Added"
                        : change.type === "removed"
                          ? "Removed"
                          : "Changed"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {formatTime(change.entry.startTime)} –{" "}
                    {formatTime(change.entry.endTime)}
                  </p>
                  {change.type === "changed" && change.fields.length > 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {change.fields.join(", ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(value) => !value && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete class?</DialogTitle>
            <DialogDescription>
              This class will be removed from the schedule. You can add it back
              from your weekly routine later.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CRAdminTomorrowSchedule;
