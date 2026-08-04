import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  User,
  Pencil,
  Save,
  X,
  CalendarClock,
  Award,
  BookOpen,
  TrendingUp,
  GraduationCap,
} from "lucide-react";
import { toast } from "sonner";
import AvatarUpload from "../profile/AvatarUpload";
import { updateStudentProfile } from "../../services/studentCourses.service";

const selectClass =
  "flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50";

const Field = ({ label, children }) => (
  <div className="space-y-1.5">
    <Label>{label}</Label>
    {children}
  </div>
);

const ValueField = ({ label, value }) => (
  <div className="space-y-1">
    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
    <p className="text-sm text-gray-900 dark:text-white">{value || "—"}</p>
  </div>
);

const getInitials = (name) =>
  name?.split(" ").map((part) => part[0]).join("").toUpperCase() || "U";

const buildForm = (profile, user) => ({
  personal: {
    name: profile?.personal?.name || user?.name || "",
    studentId: profile?.personal?.studentId || "",
    registrationNumber: profile?.personal?.registrationNumber || "",
    department: profile?.personal?.department || "",
    program: profile?.personal?.program || "",
    session: profile?.personal?.session || "",
    email: profile?.personal?.email || user?.email || "",
    phone: profile?.personal?.phone || "",
    dateOfBirth: profile?.personal?.dateOfBirth || "",
    gender: profile?.personal?.gender || "",
    bloodGroup: profile?.personal?.bloodGroup || "",
    address: profile?.personal?.address || "",
    emergencyContact: profile?.personal?.emergencyContact || "",
    profileImage: profile?.personal?.profileImage || "",
  },
  academic: {
    currentYear: Number(profile?.academic?.currentYear) || 1,
    currentSemester: Number(profile?.academic?.currentSemester) || 1,
    section: profile?.academic?.section || "",
    admissionYear: profile?.academic?.admissionYear || new Date().getFullYear(),
    expectedGraduationYear:
      profile?.academic?.expectedGraduationYear || new Date().getFullYear() + 4,
    // Backend sync fields
    department: profile?.academic?.department || profile?.personal?.department || "",
    semester: profile?.academic?.semester || String(profile?.academic?.currentSemester || 1),
    academicSession: profile?.academic?.academicSession || "",
  },
  performance: {
    cgpa: Number(profile?.performance?.cgpa) || 0,
    completedCredits: Number(profile?.performance?.completedCredits) || 0,
    requiredCredits: Number(profile?.performance?.requiredCredits) || 160,
  },
});

const StudentProfileForm = ({
  profile,
  user,
  editMode,
  onStartEdit,
  onCancelEdit,
  onSaved,
  updatePersonalInfo,
  updateAcademicInfo,
  updatePerformance,
}) => {
  const [form, setForm] = useState(() => buildForm(profile, user));
  const [savingAcademic, setSavingAcademic] = useState(false);

  const updateField = (section, key, value) => {
    setForm((prev) => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }));
  };

  const handleProfileImageChange = (image) => {
    updateField("personal", "profileImage", image || "");
  };

  const handleStartEdit = () => {
    setForm(buildForm(profile, user));
    onStartEdit();
  };

  const handleSaveProfile = () => {
    updatePersonalInfo(form.personal);
    updateAcademicInfo(form.academic);
    updatePerformance(form.performance);
    onSaved();
    toast.success("Profile saved successfully");
  };

  const handleCancel = () => {
    setForm(buildForm(profile, user));
    onCancelEdit();
    toast.info("Editing cancelled");
  };

  const handleUpdateAcademic = () => {
    updateAcademicInfo(form.academic);
    toast.success("Academic information updated");
  };

  const handleSyncAcademicToBackend = async () => {
    setSavingAcademic(true);
    try {
      await updateStudentProfile({
        department: form.academic.department,
        semester: form.academic.semester,
        section: form.academic.section,
        academicSession: form.academic.academicSession,
      });
      toast.success("Academic profile synced to backend");
    } catch {
      toast.error("Failed to sync academic profile");
    } finally {
      setSavingAcademic(false);
    }
  };

  const remainingCredits = Math.max(
    0,
    Number(form.performance.requiredCredits) - Number(form.performance.completedCredits),
  );

  const personalSummary = [
    { label: "Full Name", value: form.personal.name },
    { label: "Student ID", value: form.personal.studentId },
    { label: "Registration Number", value: form.personal.registrationNumber },
    { label: "Department", value: form.personal.department },
    { label: "Program", value: form.personal.program },
    { label: "Session", value: form.personal.session },
    { label: "Email", value: form.personal.email },
    { label: "Phone", value: form.personal.phone },
    { label: "Date of Birth", value: form.personal.dateOfBirth },
    { label: "Gender", value: form.personal.gender },
    { label: "Blood Group", value: form.personal.bloodGroup },
    { label: "Emergency Contact", value: form.personal.emergencyContact },
  ];

  const academicSummary = [
    { label: "Current Year", value: `Year ${form.academic.currentYear}` },
    { label: "Current Semester", value: `Semester ${form.academic.currentSemester}` },
    { label: "Section", value: form.academic.section ? `Section ${form.academic.section}` : "—" },
    { label: "Admission Year", value: String(form.academic.admissionYear) },
    { label: "Expected Graduation Year", value: String(form.academic.expectedGraduationYear) },
    { label: "Department (Course Matching)", value: form.academic.department || "—" },
    { label: "Semester (Course Matching)", value: form.academic.semester || "—" },
    { label: "Academic Session (Course Matching)", value: form.academic.academicSession || "—" },
  ];

  const renderPerformanceStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
        <TrendingUp className="w-5 h-5 text-blue-600 shrink-0" />
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">CGPA Progress</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {Number(form.performance.cgpa).toFixed(2)} / 4.00
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
        <BookOpen className="w-5 h-5 text-green-600 shrink-0" />
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Credits Completed</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {Number(form.performance.completedCredits)} /{" "}
            {Number(form.performance.requiredCredits)}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
        <Award className="w-5 h-5 text-orange-600 shrink-0" />
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Remaining Credits</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{remainingCredits}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6" data-testid="student-profile">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {editMode ? "Edit Profile" : "Student Profile"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your single source of truth for academic information
          </p>
        </div>
        {editMode ? (
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" onClick={handleCancel} data-testid="cancel-edit-button">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSaveProfile} data-testid="save-profile-button">
              <Save className="w-4 h-4 mr-2" />
              Save Profile
            </Button>
          </div>
        ) : (
          <Button onClick={handleStartEdit} data-testid="edit-profile-button">
            <Pencil className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="w-5 h-5 mr-2 text-blue-600" />
            Personal Information
          </CardTitle>
          <CardDescription>Basic details about you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {editMode ? (
            <>
              <AvatarUpload
                value={form.personal.profileImage}
                name={form.personal.name}
                onChange={handleProfileImageChange}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Field label="Full Name">
                  <Input
                    value={form.personal.name}
                    onChange={(e) => updateField("personal", "name", e.target.value)}
                    placeholder="Your full name"
                  />
                </Field>
                <Field label="Student ID">
                  <Input
                    value={form.personal.studentId}
                    onChange={(e) => updateField("personal", "studentId", e.target.value)}
                    placeholder="e.g. 2020-000-000"
                  />
                </Field>
                <Field label="Registration Number">
                  <Input
                    value={form.personal.registrationNumber}
                    onChange={(e) => updateField("personal", "registrationNumber", e.target.value)}
                    placeholder="e.g. 2019330000"
                  />
                </Field>
                <Field label="Department">
                  <Input
                    value={form.personal.department}
                    onChange={(e) => updateField("personal", "department", e.target.value)}
                    placeholder="e.g. Computer Science & Engineering"
                  />
                </Field>
                <Field label="Program">
                  <Input
                    value={form.personal.program}
                    onChange={(e) => updateField("personal", "program", e.target.value)}
                    placeholder="e.g. B.Sc. Engineering (CSE)"
                  />
                </Field>
                <Field label="Session">
                  <Input
                    value={form.personal.session}
                    onChange={(e) => updateField("personal", "session", e.target.value)}
                    placeholder="e.g. 2020-21"
                  />
                </Field>
                <Field label="Email">
                  <Input
                    type="email"
                    value={form.personal.email}
                    onChange={(e) => updateField("personal", "email", e.target.value)}
                    placeholder="you@example.com"
                  />
                </Field>
                <Field label="Phone">
                  <Input
                    value={form.personal.phone}
                    onChange={(e) => updateField("personal", "phone", e.target.value)}
                    placeholder="e.g. 01XXXXXXXXX"
                  />
                </Field>
                <Field label="Date of Birth">
                  <Input
                    type="date"
                    value={form.personal.dateOfBirth}
                    onChange={(e) => updateField("personal", "dateOfBirth", e.target.value)}
                  />
                </Field>
                <Field label="Gender">
                  <select
                    className={selectClass}
                    value={form.personal.gender}
                    onChange={(e) => updateField("personal", "gender", e.target.value)}
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </Field>
                <Field label="Blood Group">
                  <select
                    className={selectClass}
                    value={form.personal.bloodGroup}
                    onChange={(e) => updateField("personal", "bloodGroup", e.target.value)}
                  >
                    <option value="">Select blood group</option>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((group) => (
                      <option key={group} value={group}>
                        {group}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Emergency Contact">
                  <Input
                    value={form.personal.emergencyContact}
                    onChange={(e) => updateField("personal", "emergencyContact", e.target.value)}
                    placeholder="Name and phone number"
                  />
                </Field>
                <div className="md:col-span-2 lg:col-span-3">
                  <Field label="Address">
                    <Textarea
                      value={form.personal.address}
                      onChange={(e) => updateField("personal", "address", e.target.value)}
                      placeholder="Current address"
                    />
                  </Field>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20">
                  {form.personal.profileImage ? (
                    <AvatarImage src={form.personal.profileImage} alt={form.personal.name} />
                  ) : (
                    <AvatarFallback>{getInitials(form.personal.name)}</AvatarFallback>
                  )}
                </Avatar>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {personalSummary.map((item) => (
                  <ValueField key={item.label} {...item} />
                ))}
                <div className="md:col-span-2 lg:col-span-3">
                  <ValueField label="Address" value={form.personal.address} />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <GraduationCap className="w-5 h-5 mr-2 text-blue-600" />
            Academic Profile
          </CardTitle>
          <CardDescription>
            Current semester status and academic timeline
          </CardDescription>
        </CardHeader>
        <CardContent>
          {editMode ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Field label="Current Year">
                  <select
                    className={selectClass}
                    value={form.academic.currentYear}
                    onChange={(e) => updateField("academic", "currentYear", Number(e.target.value))}
                  >
                    {[1, 2, 3, 4].map((year) => (
                      <option key={year} value={year}>
                        Year {year}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Current Semester">
                  <select
                    className={selectClass}
                    value={form.academic.currentSemester}
                    onChange={(e) => updateField("academic", "currentSemester", Number(e.target.value))}
                  >
                    {[1, 2].map((semester) => (
                      <option key={semester} value={semester}>
                        Semester {semester}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Section">
                  <select
                    className={selectClass}
                    value={form.academic.section}
                    onChange={(e) => updateField("academic", "section", e.target.value)}
                  >
                    <option value="">Select section</option>
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                  </select>
                </Field>
                <Field label="Admission Year">
                  <Input
                    type="number"
                    value={form.academic.admissionYear}
                    onChange={(e) => updateField("academic", "admissionYear", Number(e.target.value))}
                  />
                </Field>
                <Field label="Expected Graduation Year">
                  <Input
                    type="number"
                    value={form.academic.expectedGraduationYear}
                    onChange={(e) =>
                      updateField("academic", "expectedGraduationYear", Number(e.target.value))
                    }
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                <Field label="Department">
                  <select
                    className={selectClass}
                    value={form.academic.department}
                    onChange={(e) => updateField("academic", "department", e.target.value)}
                  >
                    <option value="">Select department</option>
                    <option value="CSE">CSE</option>
                    <option value="EEE">EEE</option>
                    <option value="SWE">SWE</option>
                  </select>
                </Field>
                <Field label="Semester (for course matching)">
                  <select
                    className={selectClass}
                    value={form.academic.semester}
                    onChange={(e) => updateField("academic", "semester", e.target.value)}
                  >
                    <option value="">Select semester</option>
                    {["1-1", "1-2", "2-1", "2-2", "3-1", "3-2", "4-1", "4-2"].map((semester) => (
                      <option key={semester} value={semester}>
                        Semester {semester}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Academic Session (for course matching)">
                  <Input
                    value={form.academic.academicSession}
                    onChange={(e) => updateField("academic", "academicSession", e.target.value)}
                    placeholder="e.g. 2021-22, 2022-23"
                  />
                </Field>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 justify-end">
                <Button variant="outline" onClick={handleUpdateAcademic} data-testid="update-academic-button">
                  <CalendarClock className="w-4 h-4 mr-2" />
                  Update Academic Information
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSyncAcademicToBackend}
                  disabled={savingAcademic}
                  data-testid="sync-academic-button"
                >
                  {savingAcademic ? "Syncing..." : "Sync to Backend"}
                </Button>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {academicSummary.map((item) => (
                <ValueField key={item.label} {...item} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="w-5 h-5 mr-2 text-blue-600" />
            Academic Performance
          </CardTitle>
          <CardDescription>CGPA and credit completion status</CardDescription>
        </CardHeader>
        <CardContent>
          {editMode ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Field label="Current CGPA">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="4"
                    value={form.performance.cgpa}
                    onChange={(e) => updateField("performance", "cgpa", Number(e.target.value))}
                  />
                </Field>
                <Field label="Completed Credits">
                  <Input
                    type="number"
                    min="0"
                    value={form.performance.completedCredits}
                    onChange={(e) =>
                      updateField("performance", "completedCredits", Number(e.target.value))
                    }
                  />
                </Field>
                <Field label="Required Credits">
                  <Input
                    type="number"
                    min="0"
                    value={form.performance.requiredCredits}
                    onChange={(e) =>
                      updateField("performance", "requiredCredits", Number(e.target.value))
                    }
                  />
                </Field>
                <Field label="Remaining Credits">
                  <Input type="number" value={remainingCredits} disabled />
                </Field>
              </div>
              <div className="mt-4">{renderPerformanceStats()}</div>
            </>
          ) : (
            renderPerformanceStats()
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentProfileForm;
