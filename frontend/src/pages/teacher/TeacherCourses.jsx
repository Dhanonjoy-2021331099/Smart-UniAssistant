import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  CalendarDays,
  DoorOpen,
  GraduationCap,
  Hash,
  Pencil,
  Plus,
  Save,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/dialog";
import {
  fetchTeacherCourses,
  createTeacherCourse,
  updateTeacherCourse,
  archiveTeacherCourse,
  deactivateTeacherCourse,
  activateTeacherCourse,
  deleteTeacherCourse,
  fetchTeacherDepartment,
  DEPARTMENTS,
  ACADEMIC_SESSION_PATTERN,
} from "../../services/teacherCourse.service";

const selectClass =
  "w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-600/50";

const SEMESTER_OPTIONS = [
  "1-1",
  "1-2",
  "2-1",
  "2-2",
  "3-1",
  "3-2",
  "4-1",
  "4-2",
];

const SECTION_OPTIONS = [
  { value: "A", label: "A" },
  { value: "B", label: "B" },
  { value: "A+B", label: "A+B" },
];

const COURSE_TYPE_OPTIONS = [
  { value: "theory", label: "Theory" },
  { value: "lab", label: "Lab" },
  { value: "both", label: "Theory + Lab" },
];

const semesterToNumber = (semester) => {
  const [year, part] = String(semester || "")
    .split("-")
    .map(Number);

  if (!year || !part) return Infinity;

  return (year - 1) * 2 + part;
};

const emptyForm = () => ({
  department: "CSE",
  semester: "",
  courseName: "",
  shortName: "",
  courseCode: "",
  section: "A",
  courseType: "theory",
  academicSession: "",
  academicYear: "",
  room: "",
  maxStudents: "",
  credits: "",
});

const StatusBadge = ({ status }) => {
  if (status === "active") {
    return <Badge className="bg-emerald-600 text-white">Active</Badge>;
  }

  if (status === "inactive") {
    return <Badge className="bg-amber-500 text-white">Inactive</Badge>;
  }

  return <Badge variant="secondary">Archived</Badge>;
};

const CourseCard = ({
  course,
  onEdit,
  onActivate,
  onDeactivate,
  onArchive,
  onDelete,
}) => {
  const isArchived = course.status === "archived";

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg ${
        isArchived ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
            {course.courseCode || "—"}
          </p>
          <h3 className="mt-1 text-base font-semibold text-gray-900 dark:text-white truncate">
            {course.courseName || "Untitled course"}
          </h3>
          {course.shortName && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {course.shortName}
            </p>
          )}
        </div>
        <StatusBadge status={course.status} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Badge variant="secondary">Section {course.sectionLabel || course.section}</Badge>
        <Badge variant="secondary">{course.courseTypeLabel || course.courseType}</Badge>
        <Badge variant="outline">{course.department || course.departmentName}</Badge>
      </div>

      <div className="mt-4 space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
        {(course.academicSession || course.academicYear) && (
          <p className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 shrink-0" />
            {[course.academicSession, course.academicYear].filter(Boolean).join(" · ")}
          </p>
        )}
        {course.room && (
          <p className="flex items-center gap-2">
            <DoorOpen className="w-4 h-4 shrink-0" />
            Room {course.room}
          </p>
        )}
        {course.credits > 0 && (
          <p className="flex items-center gap-2">
            <Hash className="w-4 h-4 shrink-0" />
            {course.credits} credits
          </p>
        )}
        {course.maxStudents > 0 && (
          <p className="flex items-center gap-2">
            <Users className="w-4 h-4 shrink-0" />
            {course.maxStudents} students
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => onEdit(course)}>
          <Pencil className="w-4 h-4 mr-1.5" />
          Edit
        </Button>
        {isArchived ? (
          <Button size="sm" variant="outline" onClick={() => onActivate(course)}>
            <GraduationCap className="w-4 h-4 mr-1.5" />
            Restore
          </Button>
        ) : course.status === "inactive" ? (
          <Button size="sm" variant="outline" onClick={() => onActivate(course)}>
            <GraduationCap className="w-4 h-4 mr-1.5" />
            Activate
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={() => onDeactivate(course)}>
            <Users className="w-4 h-4 mr-1.5" />
            Deactivate
          </Button>
        )}
        {!isArchived && (
          <Button size="sm" variant="outline" onClick={() => onArchive(course)}>
            <BookOpen className="w-4 h-4 mr-1.5" />
            Archive
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="text-red-600 hover:text-red-700 dark:text-red-400"
          onClick={() => onDelete(course)}
        >
          <Trash2 className="w-4 h-4 mr-1.5" />
          Delete
        </Button>
      </div>
    </div>
  );
};

const CourseDialog = ({
  open,
  editing,
  initialDepartment,
  onClose,
  onSave,
  saving,
}) => {
  const [form, setForm] = useState(emptyForm());

  const setField = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };

      if (field === "courseCode") {
        next.courseCode = value.toUpperCase();
      }

      return next;
    });
  };

  const handleOpenChange = (openChange) => {
    if (!openChange) {
      onClose();
      return;
    }

    if (editing) {
      setForm({
        department:
          editing.department &&
          DEPARTMENTS.some((entry) => entry.value === editing.department)
            ? editing.department
            : "CSE",
        semester: editing.semester || "",
        courseName: editing.courseName || "",
        shortName: editing.shortName || "",
        courseCode: editing.courseCode || "",
        section: editing.section || "A",
        courseType: editing.courseType || "theory",
        academicSession: editing.academicSession || "",
        academicYear: editing.academicYear || "",
        room: editing.room || "",
        maxStudents: editing.maxStudents || "",
        credits: editing.credits || "",
      });
    } else {
      setForm({
        ...emptyForm(),
        department: initialDepartment || "CSE",
      });
    }
  };

  const handleSave = () => {
    if (
      !form.department ||
      !form.semester ||
      !form.courseName?.trim() ||
      !form.courseCode?.trim() ||
      !form.section ||
      !form.academicSession?.trim()
    ) {
      toast.error(
        "Department, semester, course name, course code, section and academic session are required",
      );
      return;
    }

    if (!ACADEMIC_SESSION_PATTERN.test(form.academicSession.trim())) {
      toast.error("Academic session must be in a format like 2021-22");
      return;
    }

    onSave({
      department: form.department,
      semester: form.semester,
      courseName: form.courseName.trim(),
      shortName: form.shortName.trim(),
      courseCode: form.courseCode.trim().toUpperCase(),
      section: form.section,
      courseType: form.courseType,
      academicSession: form.academicSession.trim(),
      academicYear: form.academicYear.trim(),
      room: form.room.trim(),
      maxStudents: form.maxStudents ? Number(form.maxStudents) : 0,
      credits: form.credits ? Number(form.credits) : 0,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit Course" : "Add Course to Your Profile"}
          </DialogTitle>
          <DialogDescription>
            Enter the course details manually. Course Code is the unique
            identifier — Course Name and Short Name are only used for display.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Department</Label>
            <select
              className={selectClass}
              value={form.department}
              onChange={(event) => setField("department", event.target.value)}
            >
              {DEPARTMENTS.map((department) => (
                <option key={department.value} value={department.value}>
                  {department.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Semester</Label>
            <select
              className={selectClass}
              value={form.semester}
              onChange={(event) => setField("semester", event.target.value)}
            >
              <option value="">Select semester</option>
              {SEMESTER_OPTIONS.map((semester) => (
                <option key={semester} value={semester}>
                  Semester {semester}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Section</Label>
            <select
              className={selectClass}
              value={form.section}
              onChange={(event) => setField("section", event.target.value)}
            >
              {SECTION_OPTIONS.map((section) => (
                <option key={section.value} value={section.value}>
                  {section.value === "A+B" ? "A + B" : `Section ${section.value}`}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Course Type</Label>
            <select
              className={selectClass}
              value={form.courseType}
              onChange={(event) => setField("courseType", event.target.value)}
            >
              {COURSE_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label>Course Name</Label>
            <Input
              value={form.courseName}
              onChange={(event) => setField("courseName", event.target.value)}
              placeholder="e.g. Data Structures, Java Programming, Operating System"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Short Name</Label>
            <Input
              value={form.shortName}
              onChange={(event) => setField("shortName", event.target.value)}
              placeholder="e.g. DS, JAVA, OS, AI, CN"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Course Code</Label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={form.courseCode}
                onChange={(event) => setField("courseCode", event.target.value)}
                placeholder="e.g. CSE 221, CSE 331, EEE 221"
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Academic Session</Label>
            <Input
              value={form.academicSession}
              onChange={(event) => setField("academicSession", event.target.value)}
              placeholder="e.g. 2021-22, 2022-23"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Use formats like 2021-22, 2022-23, 2023-24.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Academic Year</Label>
            <Input
              value={form.academicYear}
              onChange={(event) => setField("academicYear", event.target.value)}
              placeholder="Optional — e.g. 2026"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Room</Label>
            <Input
              value={form.room}
              onChange={(event) => setField("room", event.target.value)}
              placeholder="Optional — e.g. 303, Gallery-1, Online"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Credits</Label>
            <Input
              type="number"
              value={form.credits}
              onChange={(event) => setField("credits", event.target.value)}
              placeholder="Optional — e.g. 3, 4"
              min="0"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Maximum Students</Label>
            <Input
              type="number"
              value={form.maxStudents}
              onChange={(event) => setField("maxStudents", event.target.value)}
              placeholder="Optional"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {editing ? "Save Changes" : "Save Course"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const TeacherCourses = () => {
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data: teacherDepartment } = useQuery({
    queryKey: ["teacher-department"],
    queryFn: fetchTeacherDepartment,
  });

  const { data: courses = [], isPending: loading } = useQuery({
    queryKey: ["teacher-courses"],
    queryFn: fetchTeacherCourses,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["teacher-courses"] });

  const createMutation = useMutation({
    mutationFn: createTeacherCourse,
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
      setEditing(null);
      toast.success("Course added to your profile");
    },
    onError: (err) =>
      toast.error(err?.response?.data?.error || "Failed to add course"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ courseId, payload }) => updateTeacherCourse(courseId, payload),
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
      setEditing(null);
      toast.success("Course updated");
    },
    onError: (err) =>
      toast.error(err?.response?.data?.error || "Failed to update course"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ action, courseId }) => {
      if (action === "archive") return archiveTeacherCourse(courseId);
      if (action === "deactivate") return deactivateTeacherCourse(courseId);
      return activateTeacherCourse(courseId);
    },
    onSuccess: (_, variables) => {
      invalidate();
      toast.success(
        variables.action === "archive"
          ? "Course archived"
          : variables.action === "deactivate"
            ? "Course deactivated"
            : "Course activated",
      );
    },
    onError: (err) => toast.error(err?.response?.data?.error || "Action failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTeacherCourse,
    onSuccess: () => {
      invalidate();
      toast.success("Course removed from your profile");
    },
    onError: (err) =>
      toast.error(err?.response?.data?.error || "Failed to remove course"),
  });

  const grouped = useMemo(() => {
    const map = new Map();

    courses.forEach((course) => {
      const key = course.semester || "Unassigned";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(course);
    });

    return [...map.entries()].sort((a, b) => {
      const diff = semesterToNumber(a[0]) - semesterToNumber(b[0]);
      return diff === 0 ? String(a[0]).localeCompare(String(b[0])) : diff;
    });
  }, [courses]);

  const activeCount = courses.filter((course) => course.status === "active").length;
  const inactiveCount = courses.filter((course) => course.status === "inactive").length;
  const archivedCount = courses.filter((course) => course.status === "archived").length;

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (course) => {
    setEditing(course);
    setDialogOpen(true);
  };

  const handleSave = (payload) => {
    if (editing) {
      updateMutation.mutate({ courseId: editing._id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleArchive = (course) => {
    if (window.confirm(`Archive ${course.courseName} (${course.courseCode})?`)) {
      statusMutation.mutate({ action: "archive", courseId: course._id });
    }
  };

  const handleDeactivate = (course) => {
    if (window.confirm(`Deactivate ${course.courseName} (${course.courseCode})?`)) {
      statusMutation.mutate({ action: "deactivate", courseId: course._id });
    }
  };

  const handleActivate = (course) => {
    statusMutation.mutate({ action: "activate", courseId: course._id });
  };

  const handleDelete = (course) => {
    if (
      window.confirm(
        `Remove ${course.courseName} (${course.courseCode}) from your profile? This cannot be undone.`,
      )
    ) {
      deleteMutation.mutate(course._id);
    }
  };

  return (
    <div className="space-y-6" data-testid="teacher-courses-page">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            My Courses
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage all your assigned courses semester-wise.
          </p>
        </div>
        <div className="shrink-0">
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Add Course
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Active
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {activeCount}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Inactive
          </p>
          <p className="mt-1 text-2xl font-bold text-amber-500">{inactiveCount}</p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Archived
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-700 dark:text-gray-300">
            {archivedCount}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48" data-testid="loading-spinner">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      ) : grouped.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
          <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No courses yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Add your first course to get started. Your courses become the single
            source of truth for results, materials and assignments.
          </p>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Add Course
          </Button>
        </div>
      ) : (
        grouped.map(([semester, semesterCourses]) => (
          <section key={semester}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {semester === "Unassigned" ? "Unassigned" : `Semester ${semester}`}
              </h2>
              <Badge variant="outline">{semesterCourses.length}</Badge>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {semesterCourses.map((course) => (
                <CourseCard
                  key={course._id}
                  course={course}
                  onEdit={openEdit}
                  onActivate={handleActivate}
                  onDeactivate={handleDeactivate}
                  onArchive={handleArchive}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </section>
        ))
      )}

      <CourseDialog
        open={dialogOpen}
        editing={editing}
        initialDepartment={teacherDepartment}
        onClose={() => {
          setDialogOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
        saving={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
};

export default TeacherCourses;
