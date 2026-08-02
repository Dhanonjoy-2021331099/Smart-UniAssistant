/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import {
  loadStudentProfile,
  saveStudentProfile,
} from "../services/studentProfile.service";

const StudentProfileContext = createContext();

export const useStudentProfile = () => {
  const context = useContext(StudentProfileContext);
  if (!context) {
    throw new Error(
      "useStudentProfile must be used within StudentProfileProvider",
    );
  }
  return context;
};

export const StudentProfileProvider = ({ children }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    loadStudentProfile()
      .then((data) => {
        if (!cancelled) {
          setProfile(data);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const persistProfile = useCallback((updater) => {
    setProfile((prev) => {
      const next = updater(prev);
      saveStudentProfile(next).catch((error) => {
        console.error("Failed to save student profile:", error);
      });
      return next;
    });
  }, []);

  const updateProfile = useCallback(
    (updates) => {
      persistProfile((prev) => ({ ...prev, ...updates }));
    },
    [persistProfile],
  );

  const updatePersonalInfo = useCallback(
    (personal) => {
      persistProfile((prev) => ({
        ...prev,
        personal: { ...prev.personal, ...personal },
      }));
    },
    [persistProfile],
  );

  const updateAcademicInfo = useCallback(
    (academic) => {
      persistProfile((prev) => ({
        ...prev,
        academic: { ...prev.academic, ...academic },
      }));
    },
    [persistProfile],
  );

  const updatePerformance = useCallback(
    (performance) => {
      persistProfile((prev) => ({
        ...prev,
        performance: { ...prev.performance, ...performance },
      }));
    },
    [persistProfile],
  );

  const academicYear = Number(profile?.academic?.currentYear) || 1;
  const academicSemester = Number(profile?.academic?.currentSemester) || 1;

  const value = {
    profile,
    loading,
    updateProfile,
    updatePersonalInfo,
    updateAcademicInfo,
    updatePerformance,
    academicYear,
    academicSemester,
    semesterLabel: `Year ${academicYear} - Semester ${academicSemester}`,
  };

  return (
    <StudentProfileContext.Provider value={value}>
      {children}
    </StudentProfileContext.Provider>
  );
};
