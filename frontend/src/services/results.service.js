import api from "./api.js";

const unwrap = (response) => {
  if (response?.success === true && response.data !== undefined) {
    return response.data;
  }

  return response;
};

export const RESULT_TYPES = [
  { value: "mid1", label: "Mid Term 1" },
  { value: "mid2", label: "Mid Term 2" },
  { value: "final", label: "Final" },
  { value: "lab", label: "Lab" },
  { value: "assignment", label: "Assignment" },
  { value: "quiz", label: "Quiz" },
  { value: "project", label: "Project" },
  { value: "viva", label: "Viva" },
];

export const resultTypeLabel = (value) =>
  RESULT_TYPES.find((type) => type.value === value)?.label || value || "Result";

export const fetchTeacherResults = async (params = {}) => {
  const { data } = await api.get("/api/results", { params });
  return unwrap(data);
};

export const createResult = async (payload) => {
  const { data } = await api.post("/api/results", payload);
  return unwrap(data);
};

export const bulkCreateResults = async (payload) => {
  const { data } = await api.post("/api/results/bulk", payload);
  return unwrap(data);
};

export const uploadResultFile = async (formData) => {
  const { data } = await api.post("/api/results/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return unwrap(data);
};

export const publishResult = async (resultId) => {
  const { data } = await api.post(`/api/results/${resultId}/publish`);
  return unwrap(data);
};

export const bulkPublishResults = async (resultIds) => {
  const { data } = await api.post("/api/results/bulk-publish", { resultIds });
  return unwrap(data);
};

export const publishUploadedResults = async (payload) => {
  const { data } = await api.post("/api/results/publish-upload", payload);
  return unwrap(data);
};

export const publishResultPdf = async (formData) => {
  const { data } = await api.post("/api/results/publish-pdf", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return unwrap(data);
};

export const replaceResult = async (resultId, payload) => {
  const { data } = await api.post(`/api/results/${resultId}/replace`, payload);
  return unwrap(data);
};

export const replaceResultFile = async (resultId, formData) => {
  const { data } = await api.post(
    `/api/results/${resultId}/replace-file`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return unwrap(data);
};

export const fetchResultVersions = async (resultId) => {
  const { data } = await api.get(`/api/results/${resultId}/versions`);
  return unwrap(data);
};

export const archiveResult = async (resultId) => {
  const { data } = await api.delete(`/api/results/${resultId}`);
  return unwrap(data);
};

export const deleteResultPermanently = async (resultId) => {
  const { data } = await api.delete(`/api/results/${resultId}/permanent`);
  return unwrap(data);
};

export const fetchMyResults = async (params = {}) => {
  const { data } = await api.get("/api/results/my", { params });
  return unwrap(data);
};

export const downloadResultFile = async (resultId) => {
  const response = await api.get(`/api/results/download/${resultId}`, {
    responseType: "blob",
  });
  return response.data;
};

export const triggerResultDownload = (resultId, fileName = "result") => {
  downloadResultFile(resultId)
    .then((blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    })
    .catch(() => {
      throw new Error("Failed to download file");
    });
};

export const viewResultFile = (resultId) => {
  api
    .get(`/api/results/download/${resultId}`, { responseType: "blob" })
    .then((response) => {
      const url = window.URL.createObjectURL(response.data);
      window.open(url, "_blank");
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    })
    .catch(() => {
      throw new Error("Failed to open file");
    });
};
