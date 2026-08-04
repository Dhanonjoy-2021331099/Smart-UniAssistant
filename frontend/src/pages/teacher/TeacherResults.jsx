import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Award,
  Clock,
  Download,
  Eye,
  FileText,
  FileUp,
  History,
  RefreshCw,
  Search,
  Send,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { fetchTeacherCourses } from "../../services/teacherCourse.service";
import {
  RESULT_TYPES,
  resultTypeLabel,
  fetchTeacherResults,
  publishResultPdf,
  replaceResultFile,
  fetchResultVersions,
  archiveResult,
  triggerResultDownload,
  viewResultFile,
} from "../../services/results.service";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";

const selectClass =
  "w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-600/50";

const semesterToNumber = (semester) => {
  const [year, part] = String(semester || "")
    .split("-")
    .map(Number);

  if (!year || !part) return Infinity;

  return (year - 1) * 2 + part;
};

const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatFileSize = (bytes) => {
  if (bytes == null || Number.isNaN(Number(bytes))) return "";
  const value = Number(bytes);
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(2)} MB`;
};

const StatusBadge = ({ status }) => {
  if (status === "published") {
    return <Badge className="bg-emerald-600 text-white">Published</Badge>;
  }

  if (status === "archived") {
    return <Badge variant="secondary">Archived</Badge>;
  }

  return <Badge variant="outline">Draft</Badge>;
};

const ReplacePdfDialog = ({ result, onClose, onReplace, replacing }) => {
  const [file, setFile] = useState(null);
  const [reason, setReason] = useState("");

  return (
    <Dialog open={Boolean(result)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Replace Result PDF</DialogTitle>
          <DialogDescription>
            {result?.courseCode} · {result?.courseName} ·{" "}
            {result ? resultTypeLabel(result.resultType) : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>New PDF</Label>
            <input
              type="file"
              accept=".pdf"
              data-testid="replace-pdf-input"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-600 dark:text-gray-400 file:mr-4 file:rounded-md file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-blue-700"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Only PDF files. The previous PDF is replaced, a new version is
              recorded, and matching students see the latest PDF.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Reason for replacement</Label>
            <Input
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="e.g. Re-evaluation, correction"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!file) {
                  toast.error("Select a PDF file to upload");
                  return;
                }

                const formData = new FormData();
                formData.append("file", file);
                if (reason.trim()) formData.append("reason", reason.trim());

                onReplace(result._id, formData);
              }}
              disabled={replacing || !file}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {replacing ? "Uploading..." : "Replace PDF"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const VersionsDialog = ({ result, versions, onClose }) => (
  <Dialog open={Boolean(result)} onOpenChange={(open) => !open && onClose()}>
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Version History</DialogTitle>
        <DialogDescription>
          {result?.courseCode} · {result?.courseName} ·{" "}
          {result ? resultTypeLabel(result.resultType) : ""}
        </DialogDescription>
      </DialogHeader>

      {versions.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No previous versions. The current result is the only version.
        </p>
      ) : (
        <div className="space-y-3">
          {versions.map((version, index) => (
            <div
              key={version.replacedAt?.toString() || `${version.version}-${index}`}
              className="rounded-lg border border-gray-200 dark:border-gray-800 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Version {version.version}
                  </span>
                  <Badge
                    variant={version.status === "published" ? "default" : "outline"}
                  >
                    {version.status === "published" ? "Published" : "Updated"}
                  </Badge>
                </div>
                {version.updatedDate && (
                  <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Clock className="w-3 h-3" />
                    {version.updatedDate}
                    {version.updatedTime ? ` · ${version.updatedTime}` : ""}
                  </span>
                )}
              </div>

              <div className="mt-2 grid gap-1.5 text-sm text-gray-700 dark:text-gray-300 sm:grid-cols-2">
                <p>
                  <span className="text-gray-500 dark:text-gray-400">Updated By: </span>
                  {version.updatedByName || "—"}
                </p>
                <p>
                  <span className="text-gray-500 dark:text-gray-400">File: </span>
                  {version.fileName || version.currentPDF?.split("/").pop() || "—"}
                </p>
                {version.previousPDF && (
                  <p className="truncate">
                    <span className="text-gray-500 dark:text-gray-400">Previous PDF: </span>
                    {version.previousPDF.split("/").pop() || version.previousPDF}
                  </p>
                )}
                {version.currentPDF && (
                  <p className="truncate">
                    <span className="text-gray-500 dark:text-gray-400">Current PDF: </span>
                    {version.currentPDF.split("/").pop() || version.currentPDF}
                  </p>
                )}
                {version.reason && (
                  <p className="sm:col-span-2">
                    <span className="text-gray-500 dark:text-gray-400">Reason: </span>
                    {version.reason}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </DialogContent>
  </Dialog>
);

const ResultCard = ({
  result,
  onReplacePdf,
  onVersions,
  onArchive,
}) => (
  <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg">
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
          {result.courseCode || "—"}
        </p>
        <Badge variant="secondary">{resultTypeLabel(result.resultType)}</Badge>
        <StatusBadge status={result.status} />
      </div>
      <h3 className="mt-1 text-base font-semibold text-gray-900 dark:text-white truncate">
        {result.courseName || "Untitled course"}
      </h3>
      {result.shortName && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{result.shortName}</p>
      )}
    </div>

    <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-gray-600 dark:text-gray-400 sm:grid-cols-3">
      <p className="flex items-center gap-2">
        <Award className="w-4 h-4 shrink-0" />
        Semester {result.semester || "—"}
      </p>
      <p className="flex items-center gap-2">
        <UploadCloud className="w-4 h-4 shrink-0" />
        {result.departmentName || result.department || "—"}
      </p>
      <p className="flex items-center gap-2">
        <Award className="w-4 h-4 shrink-0" />
        {result.academicSession || "—"}
      </p>
      <p className="flex items-center gap-2">
        <Clock className="w-4 h-4 shrink-0" />
        Published{" "}
        {result.publishInfo?.publishedDate || formatDateTime(result.publishDate) || "—"}
        {result.publishInfo?.publishedTime ? ` · ${result.publishInfo.publishedTime}` : ""}
      </p>
      <p className="flex items-center gap-2">
        <History className="w-4 h-4 shrink-0" />
        Last Updated {formatDateTime(result.lastUpdatedAt || result.updatedAt) || "—"}
      </p>
      <p className="flex items-center gap-2">
        <Send className="w-4 h-4 shrink-0" />
        By {result.teacherName || "—"}
      </p>
      {result.fileSize != null && formatFileSize(result.fileSize) && (
        <p className="flex items-center gap-2">
          <FileText className="w-4 h-4 shrink-0" />
          {formatFileSize(result.fileSize)}
        </p>
      )}
    </div>

    <div className="mt-4 flex flex-wrap items-center gap-2">
      <Button size="sm" variant="outline" onClick={() => onReplacePdf(result)}>
        <RefreshCw className="w-4 h-4 mr-1.5" />
        Replace PDF
      </Button>
      <Button size="sm" variant="outline" onClick={() => onVersions(result)}>
        <History className="w-4 h-4 mr-1.5" />
        Versions
      </Button>
      {result.fileUrl && (
        <>
          <Button
            size="sm"
            variant="outline"
            onClick={() => viewResultFile(result._id)}
          >
            <Eye className="w-4 h-4 mr-1.5" />
            View PDF
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => triggerResultDownload(result._id, result.fileName)}
          >
            <Download className="w-4 h-4 mr-1.5" />
            Download PDF
          </Button>
        </>
      )}
      <Button
        size="sm"
        variant="ghost"
        className="text-red-600 hover:text-red-700 dark:text-red-400"
        onClick={() => onArchive(result)}
      >
        <Trash2 className="w-4 h-4 mr-1.5" />
        Delete
      </Button>
    </div>
  </div>
);

const TeacherResults = () => {
  const queryClient = useQueryClient();
  const [semester, setSemester] = useState("");
  const [courseId, setCourseId] = useState("");
  const [resultType, setResultType] = useState("");
  const [status, setStatus] = useState("");
  const [publishedDate, setPublishedDate] = useState("");
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState("list");
  const [pdf, setPdf] = useState(null);
  const [replacePdfResult, setReplacePdfResult] = useState(null);
  const [versionsResult, setVersionsResult] = useState(null);
  const [versions, setVersions] = useState([]);

  const { data: courses = [] } = useQuery({
    queryKey: ["teacher-courses"],
    queryFn: fetchTeacherCourses,
  });

  const semesterOptions = useMemo(
    () =>
      [...new Set(courses.map((course) => course.semester).filter(Boolean))].sort(
        (a, b) => semesterToNumber(a) - semesterToNumber(b),
      ),
    [courses],
  );

  const semesterCourses = useMemo(
    () =>
      semester
        ? courses.filter((course) => course.semester === semester)
        : courses,
    [courses, semester],
  );

  const selectedCourse =
    courses.find((course) => course._id === courseId) || null;

  const listParams = {
    ...(courseId ? { teacherCourseId: courseId } : {}),
    ...(semester ? { semester } : {}),
    ...(resultType ? { resultType } : {}),
    ...(status ? { status } : {}),
    ...(publishedDate ? { publishedDate } : {}),
    ...(search.trim() ? { search: search.trim() } : {}),
  };

  const {
    data: listData,
    isPending: loading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["teacher-results", listParams],
    queryFn: () => fetchTeacherResults(listParams),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["teacher-results"] });

  const publishMutation = useMutation({
    mutationFn: publishResultPdf,
    onSuccess: (data) => {
      invalidate();
      setPdf(null);
      setResultType("");
      toast.success(
        `"${data?.courseName || "Result"}" published. Matching students have been notified.`,
      );
    },
    onError: (err) =>
      toast.error(err?.response?.data?.error || "Failed to publish result"),
  });

  const replacePdfMutation = useMutation({
    mutationFn: ({ id, formData }) => replaceResultFile(id, formData),
    onSuccess: () => {
      invalidate();
      setReplacePdfResult(null);
      toast.success(
        "Result PDF replaced. Published state preserved, students notified.",
      );
    },
    onError: (err) =>
      toast.error(
        err?.response?.data?.error || "Failed to replace result PDF",
      ),
  });

  const archiveMutation = useMutation({
    mutationFn: archiveResult,
    onSuccess: () => {
      invalidate();
      toast.success("Result archived");
    },
    onError: (err) =>
      toast.error(err?.response?.data?.error || "Failed to archive result"),
  });

  const canAdd = Boolean(selectedCourse) && Boolean(resultType);

  const handlePublish = () => {
    if (!selectedCourse || !resultType) {
      toast.error("Select a course and result type first");
      return;
    }

    if (!pdf) {
      toast.error("Select a PDF file to publish");
      return;
    }

    const formData = new FormData();
    formData.append("file", pdf);
    formData.append("teacherCourseId", selectedCourse._id);
    formData.append("resultType", resultType);

    publishMutation.mutate(formData);
  };

  const openVersions = async (result) => {
    setVersionsResult(result);
    setVersions([]);

    try {
      const data = await fetchResultVersions(result._id);
      setVersions(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to load versions");
    }
  };

  const handleArchive = (result) => {
    if (window.confirm(`Archive the result for ${result.courseCode}?`)) {
      archiveMutation.mutate(result._id);
    }
  };

  const results = listData?.results || [];

  const handleSemesterChange = (value) => {
    setSemester(value);
    setCourseId("");
  };

  const resetFilters = () => {
    setSemester("");
    setCourseId("");
    setResultType("");
    setStatus("");
    setPublishedDate("");
    setSearch("");
  };

  return (
    <div className="space-y-6" data-testid="teacher-results-page">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Results Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Publish result PDFs for your courses. Students in the matching
            cohort (department + semester + academic session) receive them
            instantly.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant={mode === "list" ? "default" : "outline"}
            onClick={() => setMode("list")}
          >
            <Award className="w-4 h-4 mr-2" />
            Results
          </Button>
          <Button
            variant={mode === "add" ? "default" : "outline"}
            onClick={() => setMode("add")}
          >
            <UploadCloud className="w-4 h-4 mr-2" />
            Publish New Result
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 lg:grid-cols-5">
            <div className="space-y-1.5">
              <Label>Semester</Label>
              <select
                className={selectClass}
                value={semester}
                onChange={(event) => handleSemesterChange(event.target.value)}
                aria-label="Filter by semester"
              >
                <option value="">All semesters</option>
                {semesterOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Course</Label>
              <select
                className={selectClass}
                value={courseId}
                onChange={(event) => setCourseId(event.target.value)}
                aria-label="Filter by course"
              >
                <option value="">All courses</option>
                {semesterCourses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.courseName} ({course.shortName}) {course.courseCode}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Result Type</Label>
              <select
                className={selectClass}
                value={resultType}
                onChange={(event) => setResultType(event.target.value)}
                aria-label="Filter by result type"
              >
                <option value="">All types</option>
                {RESULT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <select
                className={selectClass}
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                aria-label="Filter by status"
              >
                <option value="">All statuses</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Published Date</Label>
              <Input
                type="date"
                value={publishedDate}
                onChange={(event) => setPublishedDate(event.target.value)}
                aria-label="Filter by published date"
                className="h-auto"
              />
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by course code, course name or short name"
                className="pl-9"
              />
            </div>
            <Button variant="outline" onClick={resetFilters}>
              <X className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {mode === "add" ? (
        <Card>
          <CardHeader>
            <CardTitle>Publish New Result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!selectedCourse ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Select a semester and a course above to publish a result. Only
                courses saved in your profile appear.
              </p>
            ) : !resultType ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Select a result type above (e.g. Mid Term 1, Final) to continue.
              </p>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-blue-600 text-white">
                    {selectedCourse.courseCode}
                  </Badge>
                  {selectedCourse.shortName && (
                    <Badge variant="secondary">{selectedCourse.shortName}</Badge>
                  )}
                  <Badge variant="secondary">{selectedCourse.department}</Badge>
                  <Badge variant="secondary">
                    Semester {selectedCourse.semester}
                  </Badge>
                  {selectedCourse.academicSession && (
                    <Badge variant="secondary">
                      {selectedCourse.academicSession}
                    </Badge>
                  )}
                  <Badge variant="secondary">{resultTypeLabel(resultType)}</Badge>
                </div>

                <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-6 text-center">
                  <FileUp className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Upload the result sheet as a PDF. It will be published to
                    every matching student (department + semester + academic
                    session) instantly, with a notification.
                  </p>
                  <label className="inline-flex cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      data-testid="publish-pdf-input"
                      onChange={(event) => {
                        setPdf(event.target.files?.[0] || null);
                        event.target.value = "";
                      }}
                    />
                    <Button disabled={!canAdd}>
                      <UploadCloud className="w-4 h-4 mr-2" />
                      Choose PDF
                    </Button>
                  </label>
                  {pdf && (
                    <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                      {pdf.name} selected
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2">
                  <Button
                    onClick={handlePublish}
                    disabled={!pdf || publishMutation.isPending}
                    data-testid="publish-pdf-button"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {publishMutation.isPending ? "Publishing..." : "Publish Result"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Results ({listData?.total || 0})
          </h2>

          {loading ? (
            <div className="flex justify-center items-center h-48" data-testid="loading-spinner">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            </div>
          ) : isError ? (
            <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 p-6 text-center">
              <p className="text-red-700 dark:text-red-300 mb-4">
                {error?.response?.data?.error ||
                  error?.message ||
                  "Failed to load results"}
              </p>
              <Button onClick={() => refetch()}>Try Again</Button>
            </div>
          ) : results.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((result) => (
                <ResultCard
                  key={result._id}
                  result={result}
                  onReplacePdf={setReplacePdfResult}
                  onVersions={openVersions}
                  onArchive={handleArchive}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
              <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No results found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Publish a result PDF for your courses or adjust the filters.
              </p>
            </div>
          )}
        </div>
      )}

      <ReplacePdfDialog
        result={replacePdfResult}
        onClose={() => setReplacePdfResult(null)}
        onReplace={(id, formData) =>
          replacePdfMutation.mutate({ id, formData })
        }
        replacing={replacePdfMutation.isPending}
      />

      <VersionsDialog
        result={versionsResult}
        versions={versions}
        onClose={() => setVersionsResult(null)}
      />
    </div>
  );
};

export default TeacherResults;
