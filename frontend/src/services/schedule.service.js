import api from "./api.js";

const unwrap = (response) => {
  if (response?.success === true && response.data !== undefined) {
    return response.data;
  }

  return response;
};

export const fetchRoutine = async () => {
  const { data } = await api.get("/api/schedules/routine");
  return unwrap(data);
};

export const saveRoutine = async (classes) => {
  const { data } = await api.put("/api/schedules/routine", { classes });
  return unwrap(data);
};

export const generateSchedule = async (date) => {
  const { data } = await api.post("/api/schedules/generate", { date });
  return unwrap(data);
};

export const fetchSchedules = async (params = {}) => {
  const { data } = await api.get("/api/schedules", { params });
  return unwrap(data);
};

export const fetchScheduleById = async (scheduleId) => {
  const { data } = await api.get(`/api/schedules/${scheduleId}`);
  return unwrap(data);
};

export const updateSchedule = async (scheduleId, payload) => {
  const { data } = await api.put(`/api/schedules/${scheduleId}`, payload);
  return unwrap(data);
};

export const publishSchedule = async (scheduleId) => {
  const { data } = await api.patch(`/api/schedules/${scheduleId}/publish`);
  return unwrap(data);
};

export const copySchedule = async (scheduleId, targetDate, historyId) => {
  const { data } = await api.post(`/api/schedules/${scheduleId}/copy`, {
    targetDate,
    ...(historyId ? { historyId } : {}),
  });
  return unwrap(data);
};

export const restoreScheduleVersion = async (scheduleId, historyId) => {
  const { data } = await api.post(
    `/api/schedules/${scheduleId}/restore/${historyId}`,
  );
  return unwrap(data);
};

export const deleteSchedule = async (scheduleId) => {
  const { data } = await api.delete(`/api/schedules/${scheduleId}`);
  return unwrap(data);
};
