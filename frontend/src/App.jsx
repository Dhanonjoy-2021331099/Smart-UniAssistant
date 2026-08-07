import { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider } from "./context/AuthContext";
import { StudentProfileProvider } from "./context/StudentProfileContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import DashboardLayout from "./components/layout/DashboardLayout";
import { Loader2 } from "lucide-react";
import "./App.css";

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ComingSoon = lazy(() => import("./pages/ComingSoon"));

const StudentDashboard = lazy(() =>
  import("./pages/student/StudentDashboard"),
);
const StudentProfile = lazy(() => import("./pages/student/StudentProfile"));
const StudentCourses = lazy(() => import("./pages/student/StudentCourses"));
const StudentAssignments = lazy(() =>
  import("./pages/student/StudentAssignments"),
);
const StudentResults = lazy(() => import("./pages/student/StudentResults"));
const StudentNotices = lazy(() => import("./pages/student/StudentNotices"));
const StudentSchedule = lazy(() => import("./pages/student/StudentSchedule"));

const TeacherDashboard = lazy(() =>
  import("./pages/teacher/TeacherDashboard"),
);
const TeacherResults = lazy(() => import("./pages/teacher/TeacherResults"));
const TeacherCourses = lazy(() => import("./pages/teacher/TeacherCourses"));

const CRAdminDashboard = lazy(() =>
  import("./pages/cradmin/CRAdminDashboard"),
);
const CRAdminBaseRoutine = lazy(() =>
  import("./pages/schedule/CRAdminBaseRoutine"),
);
const CRAdminTomorrowSchedule = lazy(() =>
  import("./pages/schedule/CRAdminTomorrowSchedule"),
);

const ManageNotices = lazy(() => import("./pages/notices/ManageNotices"));
const NoticeDetails = lazy(() => import("./pages/notices/NoticeDetails"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <StudentProfileProvider>
            <Router>
              <Suspense fallback={<PageFallback />}>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />

                  <Route
                    path="/student"
                    element={
                      <ProtectedRoute allowedRoles={["student"]}>
                        <DashboardLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route path="dashboard" element={<StudentDashboard />} />
                    <Route path="profile" element={<StudentProfile />} />
                    <Route path="courses" element={<StudentCourses />} />
                    <Route path="assignments" element={<StudentAssignments />} />
                    <Route path="results" element={<StudentResults />} />
                    <Route
                      path="materials"
                      element={<ComingSoon title="Course Materials" />}
                    />
                    <Route
                      path="questions"
                      element={<ComingSoon title="Question Bank" />}
                    />
                    <Route
                      path="resources"
                      element={<ComingSoon title="Resources" />}
                    />
                    <Route
                      path="routine"
                      element={<ComingSoon title="Routine" />}
                    />
                    <Route path="schedule" element={<StudentSchedule />} />
                    <Route path="notices" element={<StudentNotices />} />
                    <Route path="notices/:id" element={<NoticeDetails />} />
                    <Route
                      path="events"
                      element={<ComingSoon title="Events" />}
                    />
                    <Route
                      path="settings"
                      element={<ComingSoon title="Settings" />}
                    />
                  </Route>

                  <Route
                    path="/teacher"
                    element={
                      <ProtectedRoute allowedRoles={["teacher"]}>
                        <DashboardLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route path="dashboard" element={<TeacherDashboard />} />
                    <Route path="courses" element={<TeacherCourses />} />
                    <Route
                      path="materials"
                      element={<ComingSoon title="Upload Materials" />}
                    />
                    <Route
                      path="assignments"
                      element={<ComingSoon title="Assignments" />}
                    />
                    <Route path="results" element={<TeacherResults />} />
                    <Route path="notices" element={<ManageNotices />} />
                    <Route path="notices/:id" element={<NoticeDetails />} />
                    <Route
                      path="settings"
                      element={<ComingSoon title="Settings" />}
                    />
                  </Route>

                  <Route
                    path="/cradmin"
                    element={
                      <ProtectedRoute allowedRoles={["cr_admin"]}>
                        <DashboardLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route path="dashboard" element={<CRAdminDashboard />} />
                    <Route
                      path="schedule/base"
                      element={<CRAdminBaseRoutine />}
                    />
                    <Route
                      path="schedule/tomorrow"
                      element={<CRAdminTomorrowSchedule />}
                    />
                    <Route path="notices" element={<ManageNotices />} />
                    <Route path="notices/:id" element={<NoticeDetails />} />
                    <Route
                      path="events"
                      element={<ComingSoon title="Manage Events" />}
                    />
                    <Route
                      path="routine"
                      element={<ComingSoon title="Manage Routine" />}
                    />
                    <Route
                      path="resources"
                      element={<ComingSoon title="Resources" />}
                    />
                    <Route
                      path="settings"
                      element={<ComingSoon title="Settings" />}
                    />
                  </Route>

                  <Route path="/" element={<Navigate to="/login" replace />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </Router>
            <Toaster position="top-right" />
          </StudentProfileProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
