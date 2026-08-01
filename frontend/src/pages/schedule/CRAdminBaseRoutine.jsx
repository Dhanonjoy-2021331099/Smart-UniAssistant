import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, FileEdit, MapPin, Plus, Save, Search, Trash2, Video } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent } from "../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import ClassFormModal from "../../components/schedule/ClassFormModal";
import {
  WEEKDAYS,
  formatTime,
  typeStyles,
  sectionStyles,
  modeStyles,
} from "../../components/schedule/scheduleMeta";
import { fetchRoutine, saveRoutine } from "../../services/schedule.service";

const sortClasses = (classes = []) =>
  [...classes].sort(
    (first, second) =>
      WEEKDAYS.indexOf(first.day) - WEEKDAYS.indexOf(second.day) ||
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

const CRAdminBaseRoutine = () => {
  const queryClient = useQueryClient();
  const [classes, setClasses] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [dayFilter, setDayFilter] = useState("");
  const [search, setSearch] = useState("");

  const { isPending: loading } = useQuery({
    queryKey: ["weekly-routine"],
    queryFn: async () => {
      const routine = await fetchRoutine();
      setClasses(routine?.classes || []);
      return routine;
    },
  });

  const saveMutation = useMutation({
    mutationFn: (payload) => saveRoutine(payload),
    onSuccess: () => {
      toast.success("Weekly routine saved successfully");
      queryClient.invalidateQueries({ queryKey: ["weekly-routine"] });
    },
    onError: (err) =>
      toast.error(err.response?.data?.error || "Failed to save routine"),
  });

  const openAddModal = () => {
    setEditingClass(null);
    setModalOpen(true);
  };

  const openEditModal = (entry) => {
    setEditingClass(entry);
    setModalOpen(true);
  };

  const handleClassSubmit = (entry) => {
    if (editingClass?._id) {
      setClasses((current) =>
        current.map((item) => (item._id === editingClass._id ? entry : item)),
      );
    } else {
      setClasses((current) => [...(current || []), entry]);
    }

    setModalOpen(false);
    setEditingClass(null);
  };

  const handleDelete = (entry) => {
    setClasses((current) =>
      current.filter((item) => item._id !== entry._id),
    );
  };

  const handleSave = () => {
    if (!classes || classes.length === 0) {
      toast.error("Add at least one class to the weekly routine");
      return;
    }

    saveMutation.mutate(classes);
  };

  const displayedClasses = useMemo(() => {
    if (!classes) {
      return [];
    }

    const filtered = classes.filter((entry) => {
      const matchesDay = !dayFilter || entry.day === dayFilter;
      const matchesSearch =
        !search.trim() ||
        entry.courseCode.toLowerCase().includes(search.trim().toLowerCase()) ||
        entry.courseName.toLowerCase().includes(search.trim().toLowerCase());

      return matchesDay && matchesSearch;
    });

    return sortClasses(filtered);
  }, [classes, dayFilter, search]);

  const totalClasses = classes?.length || 0;
  const hasChanges = Boolean(classes);

  return (
    <div className="space-y-6" data-testid="base-routine-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Base Weekly Routine
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create your default weekly schedule once. Daily schedules are
            generated from this routine automatically.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={openAddModal}>
            <Plus className="w-4 h-4 mr-2" />
            Add Class
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleSave}
            disabled={saveMutation.isPending || !hasChanges}
          >
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? "Saving..." : "Save Routine"}
          </Button>
        </div>
      </div>

      {totalClasses > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by course code or name..."
                  className="pl-10"
                />
              </div>
              <select
                value={dayFilter}
                onChange={(e) => setDayFilter(e.target.value)}
                aria-label="Filter by day"
                className="h-10 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Days</option>
                {WEEKDAYS.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          {loading ? (
            <TableSkeleton />
          ) : displayedClasses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {totalClasses === 0
                  ? "No routine classes yet"
                  : "No classes match your filters"}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {totalClasses === 0
                  ? "Add the classes for each weekday to build your weekly routine."
                  : "Try adjusting your search or filters."}
              </p>
              {totalClasses === 0 && (
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={openAddModal}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Class
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Day</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Room / Meeting</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedClasses.map((entry) => (
                    <TableRow key={entry._id}>
                      <TableCell className="font-medium text-gray-900 dark:text-white">
                        {entry.day}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
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
                        <Badge className={typeStyles[entry.classType] || ""}>
                          {entry.classType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={sectionStyles[entry.section] || sectionStyles.A}>
                          {entry.section === "Both" ? "A + B" : entry.section}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={modeStyles[entry.classMode] || modeStyles.Physical}>
                          {entry.classMode}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300">
                        {entry.classMode === "Online" ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Video className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                            {entry.meetingPlatform || "Online"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            {entry.room}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Edit"
                            onClick={() => openEditModal(entry)}
                          >
                            <FileEdit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700"
                            title="Delete"
                            onClick={() => handleDelete(entry)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {!loading && displayedClasses.length > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
              {displayedClasses.length} of {totalClasses} classes
            </p>
          )}
        </CardContent>
      </Card>

      <ClassFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initialValues={editingClass || {}}
        includeDay
        onSubmit={handleClassSubmit}
        title={editingClass ? "Edit Class" : "Add Class"}
      />
    </div>
  );
};

export default CRAdminBaseRoutine;
