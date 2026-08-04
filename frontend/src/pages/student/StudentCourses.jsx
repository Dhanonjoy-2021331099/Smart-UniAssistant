import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useStudentProfile } from "../../context/StudentProfileContext";
import { getStudentCourses } from "../../services/studentCourses.service";
import { GRADE_OPTIONS, calculateSemesterGPA } from "../../utils/grading";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { BookOpen, Calculator, ClipboardList, Download, Eye, FolderOpen, GraduationCap, Layers } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../lib/utils";
import { triggerResultDownload, viewResultFile } from "../../services/results.service";

const selectClass =
  "flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50";

const RESULT_TYPE_LABELS = {
  mid1: "Mid Term 1",
  mid2: "Mid Term 2",
  final: "Final",
  lab: "Lab",
  assignment: "Assignment",
  quiz: "Quiz",
  project: "Project",
  viva: "Viva",
};

const COURSE_TYPE_LABELS = {
  theory: "Theory",
  lab: "Lab",
  both: "Theory + Lab",
};

const getSemesterLabel = (semester) => `Semester ${semester}`;

const CoursesContent = ({
  profile,
  data,
  defaultSemester,
  querySemester,
  updatePerformance,
}) => {
  const navigate = useNavigate();
  const courses = useMemo(() => data?.courses || [], [data]);
  const studentInfo = data?.student;
  const hasCompleteCohort = Boolean(studentInfo?.hasCompleteCohort);

  const semesters = useMemo(() => {
    const values = [...new Set(courses.map((course) => course.semester).filter(Boolean))];
    return values.sort();
  }, [courses]);

  const [selectedSemester, setSelectedSemester] = useState(() => {
    if (querySemester && semesters.includes(querySemester)) {
      return querySemester;
    }
    if (studentInfo?.semester && semesters.includes(String(studentInfo.semester))) {
      return String(studentInfo.semester);
    }
    if (defaultSemester && semesters.includes(defaultSemester)) {
      return defaultSemester;
    }
    return semesters[0] || "";
  });

  const [semesterGrades, setSemesterGrades] = useState({});
  const [calculated, setCalculated] = useState(false);

  const semesterCourses = useMemo(
    () => courses.filter((course) => course.semester === selectedSemester),
    [courses, selectedSemester],
  );
  const grades = useMemo(
    () => semesterGrades[selectedSemester] || {},
    [selectedSemester, semesterGrades],
  );

  const semesterLabel = getSemesterLabel(selectedSemester);
  const totalCredits = useMemo(
    () => semesterCourses.reduce((sum, course) => sum + Number(course.credits), 0),
    [semesterCourses],
  );

  const results = useMemo(() => {
    const entries = semesterCourses.map((course) => ({
      credits: course.credits,
      grade: grades[course._id],
    }));
    const semesterGPA = calculateSemesterGPA(entries);
    const gradedCredits = entries
      .filter((entry) => entry.grade)
      .reduce((sum, entry) => sum + Number(entry.credits), 0);
    const priorCGPA = Number(profile?.performance?.cgpa) || 0;
    const priorCredits = Number(profile?.performance?.completedCredits) || 0;
    const totalCreditsAfter = priorCredits + gradedCredits;
    const overallCGPA =
      totalCreditsAfter > 0
        ? (priorCGPA * priorCredits + semesterGPA * gradedCredits) / totalCreditsAfter
        : 0;
    return {
      semesterGPA,
      gradedCredits,
      overallCGPA,
      totalCreditsAfter,
    };
  }, [semesterCourses, grades, profile]);

  const setGrade = (courseId, grade) => {
    setSemesterGrades((prev) => ({
      ...prev,
      [selectedSemester]: { ...(prev[selectedSemester] || {}), [courseId]: grade },
    }));
    setCalculated(false);
  };

  const handleCalculate = () => {
    setCalculated(true);
    toast.success(`Semester GPA: ${results.semesterGPA.toFixed(2)}`);
  };

  const handleUpdateDashboard = () => {
    updatePerformance({
      cgpa: Number(results.overallCGPA.toFixed(2)),
      completedCredits: results.totalCreditsAfter,
    });
    setCalculated(true);
    toast.success("Dashboard updated with calculated CGPA");
  };

  const openModule = (path, course) => {
    navigate(
      `${path}?courseCode=${encodeURIComponent(course.courseCode)}&teacherCourseId=${course._id}&semester=${selectedSemester}`,
    );
  };

  const handleViewResult = (course) => {
    if (course.latestPublished?.hasFile) {
      viewResultFile(course.latestPublished.resultId);
    } else if (course.latestPublished?.resultId) {
      navigate(`/student/results?courseCode=${encodeURIComponent(course.courseCode)}`);
    }
  };

  const handleDownloadResult = (course) => {
    if (course.latestPublished?.resultId) {
      triggerResultDownload(course.latestPublished.resultId, `${course.courseCode || "result"}.pdf`);
    }
  };

  return (
    <div className="space-y-6" data-testid="student-courses">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Courses</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Browse courses and calculate your semester GPA
        </p>
        {hasCompleteCohort && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {studentInfo?.departmentName || studentInfo?.department} | Semester{" "}
            {studentInfo?.semester} | Section {studentInfo?.section || "All"} |{" "}
            {studentInfo?.academicSession}
          </p>
        )}
      </div>

      {!hasCompleteCohort && (
        <div className="p-4 rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
          <p className="text-yellow-800 dark:text-yellow-200">
            Your academic profile is incomplete. Please update your
            <Button variant="link" className="p-0 h-auto" onClick={() => navigate("/student/profile")}>
              academic information
            </Button>
            to see enrolled courses.
          </p>
        </div>
      )}

      {courses.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {semesters.map((semester) => (
            <Button
              key={semester}
              variant={selectedSemester === semester ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedSemester(semester)}
            >
              {semester}
            </Button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Layers className="w-5 h-5 mr-2 text-blue-600" />
              Semester Summary
            </CardTitle>
            <CardDescription>{selectedSemester ? semesterLabel : "No courses yet"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Courses</span>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {semesterCourses.length}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Credits</span>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {totalCredits}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800">
              <span className="text-sm text-gray-600 dark:text-gray-400">Current CGPA</span>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {Number(profile?.performance?.cgpa || 0).toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calculator className="w-5 h-5 mr-2 text-blue-600" />
              GPA Calculator
            </CardTitle>
            <CardDescription>
              Select a grade for each course to calculate your semester GPA
            </CardDescription>
          </CardHeader>
          <CardContent>
            {semesterCourses.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No courses found for your cohort.
              </p>
            ) : (
              <>
                <div className="space-y-3">
                  {semesterCourses.map((course) => (
                    <div
                      key={course._id}
                      className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-800"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {course.courseCode} - {course.courseName}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {course.credits} credits
                        </p>
                      </div>
                      <select
                        className={cn(selectClass, "md:w-40")}
                        value={grades[course._id] || ""}
                        onChange={(e) => setGrade(course._id, e.target.value)}
                      >
                        <option value="">Select grade</option>
                        {GRADE_OPTIONS.map((grade) => (
                          <option key={grade} value={grade}>
                            {grade}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Semester GPA</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {calculated ? results.semesterGPA.toFixed(2) : "--"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Overall CGPA</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {calculated ? results.overallCGPA.toFixed(2) : "--"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleCalculate} data-testid="calculate-gpa-button">
                      Calculate
                    </Button>
                    <Button onClick={handleUpdateDashboard} data-testid="update-dashboard-button">
                      Update Dashboard
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {semesterCourses.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <GraduationCap className="w-5 h-5 mr-2 text-blue-600" />
            {semesterLabel} Courses
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {semesterCourses.map((course) => (
              <Card key={course._id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{course.courseName}</CardTitle>
                      <CardDescription>{course.courseCode}</CardDescription>
                    </div>
                    <Badge variant={course.courseType === "lab" ? "secondary" : course.courseType === "both" ? "outline" : "default"}>
                      {COURSE_TYPE_LABELS[course.courseType] || course.courseTypeLabel || "Theory"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-3">
                  <div className="flex items-center gap-4 flex-wrap text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center">
                      <BookOpen className="w-4 h-4 mr-1" />
                      {course.credits} credits
                    </span>
                    <span>{getSemesterLabel(course.semester)}</span>
                    {course.section && <span>Section: {course.section}</span>}
                    {course.academicSession && <span>{course.academicSession}</span>}
                    {course.teacherName && <span>Teacher: {course.teacherName}</span>}
                    {course.shortName && <span>{course.shortName}</span>}
                  </div>

                  <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {course.hasPublishedResults ? "Published" : "Result Pending"}
                      </span>
                      {course.hasPublishedResults && course.latestPublished && (
                        <Badge variant="outline" className="text-xs">
                          {RESULT_TYPE_LABELS[course.latestPublished.resultType] ||
                            course.latestPublished.resultType}
                        </Badge>
                      )}
                    </div>
                    {course.hasPublishedResults && course.latestPublished?.resultId ? (
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <p>
                          Published: {course.latestPublished.publishedDate}{" "}
                          {course.latestPublished.publishedTime}
                        </p>
                        {course.latestPublished.hasFile && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewResult(course)}
                              className="flex-1"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View PDF
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleDownloadResult(course)}
                              className="flex-1"
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Results will appear here once published by your teacher.
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openModule("/student/materials", course)}
                    >
                      <FolderOpen className="w-4 h-4 mr-1" />
                      Materials
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openModule("/student/resources", course)}
                    >
                      <BookOpen className="w-4 h-4 mr-1" />
                      Resources
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openModule("/student/assignments", course)}
                    >
                      <ClipboardList className="w-4 h-4 mr-1" />
                      Assignments
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const StudentCourses = () => {
  const [searchParams] = useSearchParams();
  const { profile, loading, academicYear, academicSemester, updatePerformance } =
    useStudentProfile();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["studentCourses"],
    queryFn: getStudentCourses,
  });

  if (loading || isLoading) {
    return (
      <div className="flex justify-center items-center h-64" data-testid="loading-spinner">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12" data-testid="courses-error">
        <p className="text-red-600">Failed to load courses</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          {error?.response?.data?.message || error?.response?.data?.error || error?.message}
        </p>
        <Button variant="outline" onClick={() => refetch()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <CoursesContent
      profile={profile}
      data={data}
      defaultSemester={`${academicYear}-${academicSemester}`}
      querySemester={searchParams.get("semester")}
      updatePerformance={updatePerformance}
    />
  );
};

export default StudentCourses;
