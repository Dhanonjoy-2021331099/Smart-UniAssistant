import api from "./api.js";

const unwrap = (response) => {
  if (response?.success === true && response.data !== undefined) {
    return response.data;
  }

  return response;
};

export const fetchNotices = async (params = {}) => {
  const { data } = await api.get("/api/notices", { params });
  return unwrap(data);
};

export const fetchNoticeById = async (noticeId) => {
  const { data } = await api.get(`/api/notices/${noticeId}`);
  return unwrap(data);
};

export const createNotice = async (formData) => {
  const { data } = await api.post("/api/notices", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return unwrap(data);
};

export const updateNotice = async (noticeId, formData) => {
  const { data } = await api.put(`/api/notices/${noticeId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return unwrap(data);
};

export const deleteNotice = async (noticeId) => {
  const { data } = await api.delete(`/api/notices/${noticeId}`);
  return unwrap(data);
};

export const togglePinNotice = async (noticeId) => {
  const { data } = await api.patch(`/api/notices/${noticeId}/pin`);
  return unwrap(data);
};

export const updateNoticeStatus = async (noticeId, status) => {
  const { data } = await api.patch(`/api/notices/${noticeId}/status`, { status });
  return unwrap(data);
};

export const getNoticeBasePath = (role) => {
  if (role === "teacher") {
    return "/teacher/notices";
  }

  if (role === "cr_admin" || role === "super_admin") {
    return "/cradmin/notices";
  }

  return "/student/notices";
};

export const canManageNotices = (role) =>
  role === "cr_admin" || role === "super_admin" || role === "teacher";

export const canEditNotice = (user, notice) => {
  if (!user || !notice) {
    return false;
  }

  if (user.role === "super_admin") {
    return true;
  }

  if (user.role === "cr_admin" || user.role === "teacher") {
    const creatorId = notice.createdBy?._id || notice.createdBy;
    return creatorId?.toString() === user.id?.toString() ||
      creatorId?.toString() === user._id?.toString();
  }

  return false;
};

export const isExpiredNotice = (notice) =>
  Boolean(notice?.expiryDate && new Date(notice.expiryDate) < new Date());
