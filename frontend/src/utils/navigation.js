export const getDashboardPath = (role) => {
  if (role === "teacher") {
    return "/teacher/dashboard";
  }
  if (role === "cr_admin") {
    return "/cradmin/dashboard";
  }
  return "/student/dashboard";
};

export const getProfilePath = (role) => {
  if (role === "teacher") {
    return "/teacher/settings";
  }
  if (role === "cr_admin") {
    return "/cradmin/settings";
  }
  return "/student/profile";
};
