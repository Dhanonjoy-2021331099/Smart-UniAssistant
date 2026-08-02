import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useStudentProfile } from "../../context/StudentProfileContext";
import {
  getSemesters,
  getSemesterCourses,
  getSemesterLabel,
} from "../../services/course.service";
import { GRADE_OPTIONS, calculateSemesterGPA } from "../../utils/grading";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { BookOpen, Calculator, ClipboardList, FolderOpen, Layers, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

const selectClass =
  "flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50";

const CoursesContent = ({ profile, defaultSemester, querySemester, updatePerformance }) => {
  const navigate = useNavigate();
  const [selectedSemester, setSelectedSemester] = useState(() => {
    if (querySemester && getSemesters().some((semester) => semester.id === querySemester)) {
      return querySemester;
    }
    return defaultSemester;
  });
  const [semesterGrades, setSemesterGrades] = useState({});
  const [calculated, setCalculated] = useState(false);

  const semesters = getSemesters();
  const courses = useMemo(
    () => getSemesterCourses(selectedSemester),
    [selectedSemester],
  );
  const grades = useMemo(
    () => semesterGrades[selectedSemester] || {},
    [selectedSemester, semesterGrades],
  );

  const semesterLabel = getSemesterLabel(selectedSemester);
  const totalCredits = useMemo(
    () => courses.reduce((sum, course) => sum + Number(course.credits), 0),
    [courses],
  );

  const results = useMemo(() => {
    const entries = courses.map((course) => ({
      credits: course.credits,
      grade: grades[course.id],
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
  }, [courses, grades, profile]);

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
    navigate(`${path}?course=${encodeURIComponent(course.code)}&semester=${selectedSemester}`);
  };

  return (
    <div className="space-y-6" data-testid="student-courses">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Courses</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Browse courses and calculate your semester GPA
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {semesters.map((semester) => (
          <Button
            key={semester.id}
            variant={selectedSemester === semester.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedSemester(semester.id)}
          >
            {semester.id}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Layers className="w-5 h-5 mr-2 text-blue-600" />
              Semester Summary
            </CardTitle>
            <CardDescription>{semesterLabel}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Courses</span>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {courses.length}
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
            <div className="space-y-3">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-800"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {course.code} - {course.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {course.credits} credits
                    </p>
                  </div>
                  <select
                    className={cn(selectClass, "md:w-40")}
                    value={grades[course.id] || ""}
                    onChange={(e) => setGrade(course.id, e.target.value)}
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
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <GraduationCap className="w-5 h-5 mr-2 text-blue-600" />
          {semesterLabel} Courses
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{course.name}</CardTitle>
                    <CardDescription>{course.code}</CardDescription>
                  </div>
                  <Badge variant={course.type === "Lab" ? "secondary" : course.type === "Project" ? "outline" : "default"}>
                    {course.type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="flex items-center gap-4 mb-3">
                  <span className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <BookOpen className="w-4 h-4 mr-1" />
                    {course.credits} credits
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {getSemesterLabel(course.semester)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {course.description}
                </p>
                <div className="flex flex-wrap gap-2">
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
    </div>
  );
};

const StudentCourses = () => {
  const [searchParams] = useSearchParams();
  const { profile, loading, academicYear, academicSemester, updatePerformance } =
    useStudentProfile();

  if (loading || !profile) {
    return (
      <div className="flex justify-center items-center h-64" data-testid="loading-spinner">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <CoursesContent
      profile={profile}
      defaultSemester={`${academicYear}-${academicSemester}`}
      querySemester={searchParams.get("semester")}
      updatePerformance={updatePerformance}
    />
  );
};

export default StudentCourses;
