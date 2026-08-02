import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useStudentProfile } from "../../context/StudentProfileContext";
import StudentProfileForm from "../../components/student/StudentProfileForm";

const StudentProfile = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editMode = searchParams.get("edit") === "1";
  const { user } = useAuth();
  const {
    profile,
    loading,
    updatePersonalInfo,
    updateAcademicInfo,
    updatePerformance,
  } = useStudentProfile();

  if (loading || !profile) {
    return (
      <div className="flex justify-center items-center h-64" data-testid="loading-spinner">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <StudentProfileForm
      profile={profile}
      user={user}
      editMode={editMode}
      onStartEdit={() => navigate("/student/profile?edit=1")}
      onCancelEdit={() => navigate("/student/profile", { replace: true })}
      onSaved={() => navigate("/student/profile", { replace: true })}
      updatePersonalInfo={updatePersonalInfo}
      updateAcademicInfo={updateAcademicInfo}
      updatePerformance={updatePerformance}
    />
  );
};

export default StudentProfile;
