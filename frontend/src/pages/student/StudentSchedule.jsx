import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  CalendarClock,
  CalendarDays,
  Search,
  User,
  X,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import {
  getWeekdayForDate,
  formatScheduleDate,
  toDateKey,
  addDaysToKey,
  sectionStyles,
} from "../../components/schedule/scheduleMeta";
import {
  ClassCard,
  TableSkeleton,
} from "../../components/schedule/ClassCard";
import {
  fetchSchedules,
  fetchScheduleHistory,
  fetchCourseStatistics,
} from "../../services/schedule.service";

const todayKey = toDateKey(new Date());
const tomorrowKey = addDaysToKey(todayKey, 1);

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

const PreviousDateSection = ({ dateKey, result, filters, onRetry, onRemove }) => {
  const weekday = getWeekdayForDate(dateKey);
  const schedule = result?.schedule || null;

  const matchesFilters = (entry) => {
    const term = (value) => String(value || "").trim().toLowerCase();
    const courseNameTerm = term(filters.courseName);
    const teacherTerm = term(filters.teacher);
    const courseCodeTerm = term(filters.courseCode);

    if (
      courseNameTerm &&
      !term(entry.courseName).includes(courseNameTerm)
    ) {
      return false;
    }

    if (teacherTerm && !term(entry.teacher).includes(teacherTerm)) {
      return false;
    }

    if (courseCodeTerm && !term(entry.courseCode).includes(courseCodeTerm)) {
      return false;
    }

    return true;
  };

  const classes = schedule ? schedule.classes.filter(matchesFilters) : [];

  return (
    <section
      className="rounded-xl border border-gray-200 dark:border-gray-800 p-4"
      data-testid="previous-schedule-section"
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {formatScheduleDate(dateKey)}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{weekday}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {schedule && !result?.loading && (
            <Badge className="bg-blue-600 text-white">
              {classes.length} {classes.length === 1 ? "class" : "classes"}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Remove date"
            onClick={() => onRemove(dateKey)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {result?.loading ? (
        <TableSkeleton />
      ) : result?.error ? (
        <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 p-6 text-center">
          <p className="text-red-700 dark:text-red-300 mb-4">
            {result.error?.response?.data?.error ||
              result.error?.message ||
              "Failed to load schedule"}
          </p>
          <Button onClick={() => onRetry(dateKey)}>Try Again</Button>
        </div>
      ) : schedule ? (
        classes.length > 0 ? (
          <div className="space-y-3">
            {classes.map((entry, index) => (
              <ClassCard
                key={entry._id || `${entry.section}-${entry.startTime}-${index}`}
                entry={entry}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No classes match your filters for this date.
            </p>
          </div>
        )
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
          <CalendarClock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No class schedule found for this date
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            No published schedule was found for {formatScheduleDate(dateKey)}.
          </p>
        </div>
      )}
    </section>
  );
};

const PreviousSchedulePanel = () => {
  const [selectedDate, setSelectedDate] = useState("");
  const [filters, setFilters] = useState({
    courseName: "",
    teacher: "",
    courseCode: "",
  });
  const [searchedDates, setSearchedDates] = useState([]);
  const [results, setResults] = useState({});

  const runSearch = async (dateKey) => {
    if (!dateKey) return;

    setResults((prev) => ({ ...prev, [dateKey]: { loading: true } }));

    try {
      const data = await fetchScheduleHistory({
        date: dateKey,
        courseName: filters.courseName,
        teacher: filters.teacher,
        courseCode: filters.courseCode,
      });
      const schedule = data?.schedules?.[0] || null;
      setResults((prev) => ({
        ...prev,
        [dateKey]: { schedule, loading: false, error: null },
      }));
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        [dateKey]: { schedule: null, loading: false, error },
      }));
    }
  };

  const addSearchedDate = (dateKey) => {
    setSearchedDates((prev) =>
      prev.includes(dateKey) ? prev : [dateKey, ...prev],
    );
  };

  const handleDateChange = (value) => {
    setSelectedDate(value);

    if (value) {
      addSearchedDate(value);
      runSearch(value);
    }
  };

  const handleSearch = () => {
    if (!selectedDate) return;

    addSearchedDate(selectedDate);
    runSearch(selectedDate);
  };

  const removeDate = (dateKey) => {
    setSearchedDates((prev) => prev.filter((key) => key !== dateKey));
    setResults((prev) => {
      const next = { ...prev };
      delete next[dateKey];
      return next;
    });
  };

  const inputClassName =
    "w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-600/50";

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Previous Class Schedule
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Search past published schedules by date and filter by course or
            teacher.
          </p>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => handleDateChange(event.target.value)}
              className={`${inputClassName} pl-9 [color-scheme:light] dark:[color-scheme:dark]`}
              aria-label="Search by date"
            />
          </div>
          <input
            type="text"
            value={filters.courseName}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, courseName: event.target.value }))
            }
            placeholder="Course name"
            className={`${inputClassName} lg:w-48`}
          />
          <input
            type="text"
            value={filters.teacher}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, teacher: event.target.value }))
            }
            placeholder="Teacher name"
            className={`${inputClassName} lg:w-48`}
          />
          <input
            type="text"
            value={filters.courseCode}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, courseCode: event.target.value }))
            }
            placeholder="Course code"
            className={`${inputClassName} lg:w-48`}
          />
          <Button onClick={handleSearch}>
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
        </div>

        {searchedDates.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
            <CalendarClock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Search previous schedules
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Pick a date above to view the classes that were published for that
              day.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {searchedDates.map((dateKey) => (
              <PreviousDateSection
                key={dateKey}
                dateKey={dateKey}
                result={results[dateKey]}
                filters={filters}
                onRetry={runSearch}
                onRemove={removeDate}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const StatsGridSkeleton = () => (
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
    {Array.from({ length: 6 }).map((_, index) => (
      <div
        key={index}
        className="h-64 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse"
      />
    ))}
  </div>
);

const CourseStatCard = ({ record }) => {
  const total = record.totalClasses || 0;

  const categories = [
    {
      label: "Theory",
      value: record.theoryCount || 0,
      badge: "bg-blue-600 text-white",
      bar: "bg-blue-500",
    },
    {
      label: "Lab",
      value: record.labCount || 0,
      badge: "bg-purple-600 text-white",
      bar: "bg-purple-500",
    },
    {
      label: "Physical",
      value: record.physicalCount || 0,
      badge: "bg-emerald-600 text-white",
      bar: "bg-emerald-500",
    },
    {
      label: "Online",
      value: record.onlineCount || 0,
      badge: "bg-orange-600 text-white",
      bar: "bg-orange-500",
    },
  ];

  return (
    <div
      className="flex flex-col gap-4 rounded-xl border border-gray-200 dark:border-gray-800 p-4"
      data-testid="course-stat-card"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
            {record.courseName}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Course Code: {record.courseCode}
          </p>
        </div>
        <Badge className="bg-gray-900 dark:bg-gray-700 text-white shrink-0">
          Total {total}
        </Badge>
      </div>

      <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
        <User className="w-4 h-4" />
        {record.teacher}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge className={sectionStyles[record.section] || sectionStyles.A}>
          {record.section === "Both"
            ? "Section A + B"
            : `Section ${record.section}`}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Badge key={category.label} className={category.badge}>
            {category.label} ({category.value})
          </Badge>
        ))}
      </div>

      <div className="space-y-2.5">
        {categories.map((category) => {
          const percent =
            total > 0 ? Math.round((category.value / total) * 100) : 0;

          return (
            <div key={category.label}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-600 dark:text-gray-400">
                  {category.label}
                </span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {percent}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div
                  className={`h-2 rounded-full ${category.bar}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-auto flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-3">
        <CalendarDays className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <span>
          Last Class:{" "}
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {formatScheduleDate(record.lastClassDate)}
          </span>
        </span>
      </div>
    </div>
  );
};

const CourseStatisticsPanel = () => {
  const [filters, setFilters] = useState({
    courseName: "",
    courseCode: "",
    teacher: "",
    section: "",
  });

  const {
    data,
    isPending: loading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["course-statistics"],
    queryFn: fetchCourseStatistics,
  });

  const statistics = data || [];

  const matchesFilters = (record) => {
    const term = (value) => String(value || "").trim().toLowerCase();
    const courseNameTerm = term(filters.courseName);
    const courseCodeTerm = term(filters.courseCode);
    const teacherTerm = term(filters.teacher);
    const sectionTerm = term(filters.section);

    if (courseNameTerm && !term(record.courseName).includes(courseNameTerm)) {
      return false;
    }

    if (courseCodeTerm && !term(record.courseCode).includes(courseCodeTerm)) {
      return false;
    }

    if (teacherTerm && !term(record.teacher).includes(teacherTerm)) {
      return false;
    }

    if (sectionTerm && term(record.section) !== sectionTerm) {
      return false;
    }

    return true;
  };

  const filtered = statistics.filter(matchesFilters);
  const hasActiveFilters = Object.values(filters).some(Boolean);

  const clearFilters = () =>
    setFilters({ courseName: "", courseCode: "", teacher: "", section: "" });

  const inputClassName =
    "w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-600/50";

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Course Statistics
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Completed classes per course across all published schedules.
          </p>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row">
          <input
            type="text"
            value={filters.courseName}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                courseName: event.target.value,
              }))
            }
            placeholder="Course name"
            className={`${inputClassName} lg:w-52`}
          />
          <input
            type="text"
            value={filters.courseCode}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                courseCode: event.target.value,
              }))
            }
            placeholder="Course code"
            className={`${inputClassName} lg:w-52`}
          />
          <input
            type="text"
            value={filters.teacher}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                teacher: event.target.value,
              }))
            }
            placeholder="Teacher"
            className={`${inputClassName} lg:w-52`}
          />
          <select
            value={filters.section}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                section: event.target.value,
              }))
            }
            className={`${inputClassName} lg:w-48`}
            aria-label="Filter by section"
          >
            <option value="">All sections</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
            <option value="Both">Section A + B</option>
          </select>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters}>
              <X className="w-4 h-4 mr-2" />
              Clear
            </Button>
          )}
        </div>

        {loading ? (
          <StatsGridSkeleton />
        ) : isError ? (
          <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 p-6 text-center">
            <p className="text-red-700 dark:text-red-300 mb-4">
              {error?.response?.data?.error ||
                error?.message ||
                "Failed to load course statistics"}
            </p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((record) => (
              <CourseStatCard
                key={`${record.courseName}|${record.courseCode}|${record.teacher}|${record.section}`}
                record={record}
              />
            ))}
          </div>
        ) : hasActiveFilters ? (
          <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No courses match your filters
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Try adjusting your search criteria.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No course statistics available yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Statistics will appear once schedules are published.
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
          Today&apos;s and tomorrow&apos;s classes, your previous schedules, and
          course statistics.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
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
        <Button
          variant={tab === "history" ? "default" : "outline"}
          onClick={() => setTab("history")}
        >
          <Search className="w-4 h-4 mr-2" />
          Previous Schedule
        </Button>
        <Button
          variant={tab === "statistics" ? "default" : "outline"}
          onClick={() => setTab("statistics")}
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Course Statistics
        </Button>
      </div>

      {tab === "today" ? (
        <DayPanel dateKey={todayKey} title="Today's Schedule" />
      ) : tab === "tomorrow" ? (
        <DayPanel dateKey={tomorrowKey} title="Tomorrow's Schedule" />
      ) : tab === "history" ? (
        <PreviousSchedulePanel />
      ) : (
        <CourseStatisticsPanel />
      )}
    </div>
  );
};

export default StudentSchedule;
