const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const INITIAL_REGISTER_FORM = {
  name: "",
  email: "",
  password: "",
  role: "student",
  studentId: "",
  teacherId: "",
  department: "",
  batch: "",
};

export const roleNeedsBatch = (role) =>
  role === "student" || role === "cr_admin";

export const roleNeedsStudentId = (role) =>
  role === "student" || role === "cr_admin";

export const buildRegisterPayload = (formData) => {
  const base = {
    name: formData.name.trim(),
    email: formData.email.trim().toLowerCase(),
    password: formData.password,
    role: formData.role,
  };

  if (formData.role === "student" || formData.role === "cr_admin") {
    return {
      ...base,
      studentId: formData.studentId.trim(),
      department: formData.department,
      batch: formData.batch,
    };
  }

  if (formData.role === "teacher") {
    return {
      ...base,
      teacherId: formData.teacherId.trim(),
      department: formData.department,
    };
  }

  return base;
};

export const validateRegisterForm = (formData) => {
  const errors = {};

  if (!formData.name.trim()) {
    errors.name = "Full name is required";
  }

  if (!formData.email.trim()) {
    errors.email = "Email is required";
  } else if (!EMAIL_PATTERN.test(formData.email.trim())) {
    errors.email = "Enter a valid email address";
  }

  if (!formData.password) {
    errors.password = "Password is required";
  } else if (formData.password.length < 6) {
    errors.password = "Password must be at least 6 characters";
  }

  if (!formData.role) {
    errors.role = "Role is required";
  }

  if (roleNeedsStudentId(formData.role) && !formData.studentId.trim()) {
    errors.studentId = "Student ID is required";
  }

  if (formData.role === "teacher" && !formData.teacherId.trim()) {
    errors.teacherId = "Teacher ID is required";
  }

  if (
    formData.role === "student" ||
    formData.role === "teacher" ||
    formData.role === "cr_admin"
  ) {
    if (!formData.department) {
      errors.department = "Department is required";
    }
  }

  if (roleNeedsBatch(formData.role) && !formData.batch) {
    errors.batch = "Batch is required";
  }

  return errors;
};
