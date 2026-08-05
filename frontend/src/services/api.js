import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

const unwrapResponse = (response) => {
  if (response?.success === true && response.data !== undefined) {
    return response.data;
  }

  return response;
};

export const loginUser = async (email, password) => {
  const { data } = await api.post("/api/auth/login", { email, password });
  return unwrapResponse(data);
};

export const registerUser = async (userData) => {
  const { data } = await api.post("/api/auth/register", userData);
  return unwrapResponse(data);
};

export const googleLoginUser = async (idToken) => {
  const { data } = await api.post("/api/auth/google-login", { idToken });
  return unwrapResponse(data);
};

export const getProfile = async () => {
  const { data } = await api.get("/api/auth/profile");
  return unwrapResponse(data);
};

export const completeProfile = async (profileData) => {
  const { data } = await api.post("/api/auth/complete-profile", profileData);
  return unwrapResponse(data);
};

export const getDepartments = async () => {
  const { data } = await api.get("/api/departments");
  return unwrapResponse(data);
};

export const getBatches = async (departmentId) => {
  const { data } = await api.get("/api/batches", {
    params: departmentId ? { department: departmentId } : undefined,
  });
  return unwrapResponse(data);
};

export const getStudentDashboard = async () => {
  const { data } = await api.get("/api/students/dashboard");
  return data;
};

export const getStudentResults = async () => {
  const { data } = await api.get("/api/students/results");
  return data;
};

export const getStudentAssignments = async () => {
  const { data } = await api.get("/api/students/assignments");
  return data;
};

export const getCourseMaterials = async (courseId) => {
  const { data } = await api.get("/api/students/materials", {
    params: { courseId },
  });
  return data;
};

export const calculateCGPA = async () => {
  const { data } = await api.get("/api/students/calculate-cgpa");
  return data;
};

export const submitAssignment = async (formData) => {
  const { data } = await api.post("/api/assignments/submit", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const getTeacherDashboard = async () => {
  const { data } = await api.get("/api/teachers/dashboard");
  return data;
};

export const getTeacherCourses = async () => {
  const { data } = await api.get("/api/teachers/courses");
  return data?.data ?? data;
};

export const uploadCourseMaterial = async (formData) => {
  const { data } = await api.post("/api/teachers/materials", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const createAssignment = async (assignmentData) => {
  const { data } = await api.post("/api/teachers/assignments", assignmentData);
  return data;
};

export const getAssignmentSubmissions = async (assignmentId) => {
  const { data } = await api.get(
    `/api/teachers/assignments/${assignmentId}/submissions`,
  );
  return data;
};

export const gradeSubmission = async (submissionId, gradeData) => {
  const { data } = await api.put(
    `/api/teachers/submissions/${submissionId}/grade`,
    gradeData,
  );
  return data;
};

export const uploadResults = async (resultsData) => {
  const { data } = await api.post("/api/teachers/results", resultsData);
  return data;
};

export const getCRAdminDashboard = async () => {
  const { data } = await api.get("/api/cradmin/dashboard");
  return data;
};

export const createNotice = async (noticeData) => {
  const { data } = await api.post("/api/cradmin/notices", noticeData);
  return data;
};

export const createEvent = async (eventData) => {
  const { data } = await api.post("/api/cradmin/events", eventData);
  return data;
};

export const manageRoutine = async (routineData) => {
  const { data } = await api.post("/api/cradmin/routines", routineData);
  return data;
};

export const getCourses = async (params) => {
  const { data } = await api.get("/api/courses", { params });
  return data;
};

export const getNotices = async (params) => {
  const { data } = await api.get("/api/notices", { params });
  return data;
};

export const getEvents = async (params) => {
  const { data } = await api.get("/api/events", { params });
  return data;
};

export const getResources = async (params) => {
  const { data } = await api.get("/api/resources", { params });
  return data;
};

export const getRoutines = async (params) => {
  const { data } = await api.get("/api/routines", { params });
  return data;
};

export const getQuestionBank = async (params) => {
  const { data } = await api.get("/api/questionbanks", { params });
  return data;
};

export default api;
