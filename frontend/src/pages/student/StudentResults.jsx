import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  Award,
  BookOpen,
  Calendar,
  Download,
  Eye,
  FileText,
  Search,
  X,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Card,
  CardContent,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import {
  RESULT_TYPES,
  resultTypeLabel,
  fetchMyResults,
  triggerResultDownload,
  viewResultFile,
} from "../../services/results.service";
import { getStudentCourses } from "../../services/studentCourses.service";

const selectClass =
  "w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-600/50";

const formatFileSize = (bytes) => {
  if (bytes == null || Number.isNaN(Number(bytes))) return "";
  const value = Number(bytes);
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(2)} MB`;
};

const formatPublishDate = (result) => {
  const info = result.publishInfo;
  if (info?.publishedDate) {
    return `${info.publishedDate}${info.publishedTime ? ` ${info.publishedTime}` : ""}`;
  }
  const d = result.publishDate || result.publishedAt;
  if (d) return new Date(d).toLocaleString();
  return "";
};

const ResultCard = ({ result, isHighlighted, cardRef }) => (
  <div
    ref={cardRef}
    id={`result-${result._id}`}
    className={`rounded-xl border bg-white dark:bg-gray-900 p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg ${
      isHighlighted
        ? "border-blue-500 dark:border-blue-400 ring-2 ring-blue-200 dark:ring-blue-800"
        : "border-gray-200 dark:border-gray-800"
    }`}
  >
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <Badge className="bg-blue-600 text-white shrink-0">
            {result.courseCode || "—"}
          </Badge>
          <Badge variant="secondary" className="shrink-0">
            {resultTypeLabel(result.resultType)}
          </Badge>
          {result.semester && (
            <Badge variant="outline" className="shrink-0">
              Semester {result.semester}
            </Badge>
          )}
          {result.academicSession && (
            <Badge variant="outline" className="shrink-0">
              {result.academicSession}
            </Badge>
          )}
        </div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          {result.courseName || "Untitled"}
        </h3>
        {result.shortName && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {result.shortName}
          </p>
        )}
      </div>
    </div>

    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-600 dark:text-gray-400">
      <p className="flex items-center gap-2">
        <BookOpen className="w-4 h-4 shrink-0" />
        Instructor: {result.teacherName || "—"}
      </p>
      <p className="flex items-center gap-2">
        <Calendar className="w-4 h-4 shrink-0" />
        Published: {formatPublishDate(result) || "—"}
      </p>
      {result.fileSize != null && (
        <p className="flex items-center gap-2">
          <FileText className="w-4 h-4 shrink-0" />
          File size: {formatFileSize(result.fileSize)}
        </p>
      )}
    </div>

    {result.fileUrl && (
      <div className="mt-4 flex flex-wrap gap-2">
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
          variant="default"
          onClick={() =>
            triggerResultDownload(
              result._id,
              `${result.courseCode || "result"}.pdf`,
            )
          }
        >
          <Download className="w-4 h-4 mr-1.5" />
          Download PDF
        </Button>
      </div>
    )}
  </div>
);

const StudentResults = () => {
  const [searchParams] = useSearchParams();
  const targetResultId = searchParams.get("resultId");
  const [courseFilter, setCourseFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightId, setHighlightId] = useState(targetResultId);
  const cardRefs = useRef(new Map());

  const {
    data: results = [],
    isPending: loading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["my-results"],
    queryFn: () => fetchMyResults(),
  });

  const { data: assignedData } = useQuery({
    queryKey: ["studentCourses"],
    queryFn: getStudentCourses,
  });
  const assignedCourses = useMemo(
    () => assignedData?.courses || [],
    [assignedData],
  );

  const resultCourseCodes = useMemo(
    () => new Set(results.map((r) => r.courseCode).filter(Boolean)),
    [results],
  );

  const courseOptions = useMemo(() => {
    const fromAssigned = assignedCourses
      .filter((c) => resultCourseCodes.has(c.courseCode))
      .map((c) => ({
        value: c.courseCode,
        label: `${c.courseCode} — ${c.courseName}`,
      }));
    if (fromAssigned.length > 0) return fromAssigned;
    return [...resultCourseCodes]
      .sort()
      .map((code) => ({ value: code, label: code }));
  }, [assignedCourses, resultCourseCodes]);

  const semesterOptions = useMemo(
    () =>
      [...new Set(results.map((r) => r.semester).filter(Boolean))].sort(),
    [results],
  );

  const filtered = useMemo(
    () =>
      results
        .filter((result) => {
          if (courseFilter && result.courseCode !== courseFilter) return false;
          if (typeFilter && result.resultType !== typeFilter) return false;
          if (semesterFilter && result.semester !== semesterFilter)
            return false;
          if (searchTerm) {
            const term = searchTerm.toLowerCase();
            const match = [result.courseCode, result.courseName, result.shortName, result.teacherName, result.semester].some(
              (v) => String(v || "").toLowerCase().includes(term),
            );
            if (!match) return false;
          }
          return true;
        })
        .sort(
          (a, b) =>
            new Date(b.publishDate || b.publishedAt || 0).getTime() -
            new Date(a.publishDate || a.publishedAt || 0).getTime(),
        ),
    [results, courseFilter, typeFilter, semesterFilter, searchTerm],
  );

  useEffect(() => {
    if (!targetResultId || loading) return;
    const timer = setTimeout(() => {
      const el = cardRefs.current.get(targetResultId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        setHighlightId(targetResultId);
        const clear = setTimeout(() => setHighlightId(null), 3000);
        return () => clearTimeout(clear);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [targetResultId, loading, filtered]);

  const hasFilters = Boolean(courseFilter || typeFilter || semesterFilter || searchTerm);

  const clearFilters = () => {
    setCourseFilter("");
    setTypeFilter("");
    setSemesterFilter("");
    setSearchTerm("");
  };

  return (
    <div className="space-y-6" data-testid="student-results-page">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Results
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Published results for your courses
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid gap-3 lg:grid-cols-4">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search by course code, name, or teacher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              className={`${selectClass} lg:w-full`}
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              aria-label="Filter by course"
            >
              <option value="">All courses</option>
              {courseOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <select
              className={`${selectClass} lg:w-full`}
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              aria-label="Filter by semester"
            >
              <option value="">All semesters</option>
              {semesterOptions.map((s) => (
                <option key={s} value={s}>
                  Semester {s}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-3 lg:grid-cols-4 mt-3">
            <select
              className={`${selectClass} lg:w-full`}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter by result type"
            >
              <option value="">All result types</option>
              {RESULT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <div />
            <div />
            {hasFilters && (
              <Button variant="outline" onClick={clearFilters}>
                <X className="w-4 h-4 mr-2" />
                Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div
          className="flex justify-center items-center h-64"
          data-testid="loading-spinner"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-700 dark:text-red-300 mb-4">
              {error?.response?.data?.error ||
                error?.message ||
                "Failed to load results"}
            </p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </CardContent>
        </Card>
      ) : filtered.length > 0 ? (
        <div className="space-y-4" data-testid="results-list">
          {filtered.map((result) => (
            <ResultCard
              key={result._id}
              result={result}
              isHighlighted={result._id === highlightId}
              cardRef={(el) => {
                if (el) cardRefs.current.set(result._id, el);
              }}
            />
          ))}
        </div>
      ) : hasFilters ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No results match your filters
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Try adjusting your search criteria.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No results published yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Your instructors have not published any results for you yet.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudentResults;
