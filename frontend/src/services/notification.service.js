import api from "./api.js";

const unwrap = (response) => {
  if (response?.success === true && response.data !== undefined) {
    return response.data;
  }

  return response;
};

export const fetchNotifications = async (params = {}) => {
  const { data } = await api.get("/api/notifications", { params });
  return data;
};

export const markNotificationRead = async (notificationId) => {
  const { data } = await api.patch(
    `/api/notifications/${notificationId}/read`,
  );
  return unwrap(data);
};

export const markAllNotificationsRead = async () => {
  const { data } = await api.patch("/api/notifications/read-all");
  return unwrap(data);
};
