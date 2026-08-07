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

export const getStudentAssignments = async () => {
  const { data } = await api.get("/api/students/assignments");
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

export const getCRAdminDashboard = async () => {
  const { data } = await api.get("/api/cradmin/dashboard");
  return data;
};

export default api;
