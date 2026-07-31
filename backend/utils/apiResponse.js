export const sendSuccess = (res, statusCode, message, data = undefined) => {
  const payload = { success: true, message };

  if (data !== undefined) {
    payload.data = data;
  }

  return res.status(statusCode).json(payload);
};

export const sendError = (res, statusCode, error) => {
  return res.status(statusCode).json({
    success: false,
    error,
  });
};
