const STORAGE_KEY = "smart_uniassistant_student_profile";

export const DEFAULT_STUDENT_PROFILE = {
  personal: {
    name: "",
    studentId: "",
    registrationNumber: "",
    department: "",
    program: "",
    session: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    bloodGroup: "",
    address: "",
    emergencyContact: "",
    profileImage: "",
  },
  academic: {
    currentYear: 1,
    currentSemester: 1,
    admissionYear: new Date().getFullYear(),
    expectedGraduationYear: new Date().getFullYear() + 4,
  },
  performance: {
    cgpa: 0,
    completedCredits: 0,
    requiredCredits: 160,
  },
};

const normalizeProfile = (stored) => {
  const defaults = DEFAULT_STUDENT_PROFILE;
  return {
    personal: { ...defaults.personal, ...(stored?.personal || {}) },
    academic: { ...defaults.academic, ...(stored?.academic || {}) },
    performance: { ...defaults.performance, ...(stored?.performance || {}) },
  };
};

export const loadStudentProfile = async () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return normalizeProfile(raw ? JSON.parse(raw) : null);
  } catch (error) {
    console.error("Failed to load student profile:", error);
    return normalizeProfile(null);
  }
};

export const saveStudentProfile = async (profile) => {
  const next = normalizeProfile(profile);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (error) {
    console.error("Failed to save student profile:", error);
  }
  return next;
};
