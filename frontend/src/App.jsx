import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import DashboardLayout from "./components/layout/DashboardLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentAssignments from "./pages/student/StudentAssignments";
import StudentResults from "./pages/student/StudentResults";
import StudentNotices from "./pages/student/StudentNotices";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import CRAdminDashboard from "./pages/cradmin/CRAdminDashboard";
import ManageNotices from "./pages/notices/ManageNotices";
import NoticeDetails from "./pages/notices/NoticeDetails";
import ComingSoon from "./pages/ComingSoon";
import "./App.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router>
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
                <Route
                  path="courses"
                  element={<ComingSoon title="Courses" />}
                />
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
                <Route
                  path="notices"
                  element={<StudentNotices />}
                />
                <Route path="notices/:id" element={<NoticeDetails />} />
                <Route path="events" element={<ComingSoon title="Events" />} />
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
                <Route
                  path="courses"
                  element={<ComingSoon title="My Courses" />}
                />
                <Route
                  path="materials"
                  element={<ComingSoon title="Upload Materials" />}
                />
                <Route
                  path="assignments"
                  element={<ComingSoon title="Assignments" />}
                />
                <Route
                  path="results"
                  element={<ComingSoon title="Results Management" />}
                />
                <Route
                  path="notices"
                  element={<ManageNotices />}
                />
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
                  path="notices"
                  element={<ManageNotices />}
                />
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
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Router>
          <Toaster position="top-right" />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
