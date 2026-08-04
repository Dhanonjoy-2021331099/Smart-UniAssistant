import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { registerUser, getDepartments, getBatches } from "../services/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import FormFieldError from "../components/register/FormFieldError";
import {
  INITIAL_REGISTER_FORM,
  buildRegisterPayload,
  roleNeedsBatch,
  roleNeedsStudentId,
  validateRegisterForm,
  SEMESTER_OPTIONS,
} from "../utils/registerValidation";
import { DEPARTMENTS } from "../services/teacherCourse.service";
import {
  GraduationCap,
  Mail,
  Lock,
  User,
  Hash,
  Building2,
  Layers,
} from "lucide-react";
import { toast } from "sonner";

const selectClassName =
  "flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60";

const Register = () => {
  const [formData, setFormData] = useState(INITIAL_REGISTER_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const needsBatch = roleNeedsBatch(formData.role);
  const isCrAdmin = formData.role === "cr_admin";
  const isStudent = formData.role === "student";

  const {
    data: departments = [],
    isLoading: departmentsLoading,
    isError: departmentsError,
  } = useQuery({
    queryKey: ["departments"],
    queryFn: getDepartments,
    enabled: isCrAdmin,
  });

  const {
    data: batches = [],
    isLoading: batchesLoading,
    isError: batchesError,
  } = useQuery({
    queryKey: ["batches", formData.department],
    queryFn: () => getBatches(formData.department),
    enabled: needsBatch && Boolean(formData.department),
  });

  useEffect(() => {
    if (departmentsError) {
      toast.error("Failed to load departments");
    }
  }, [departmentsError]);

  useEffect(() => {
    if (batchesError) {
      toast.error("Failed to load batches for the selected department");
    }
  }, [batchesError]);

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };

      if (field === "role") {
        next.studentId = "";
        next.teacherId = "";
        next.department = "";
        next.batch = "";
        next.semester = "";
        next.academicSession = "";
        next.section = "";
      }

      if (field === "department") {
        next.batch = "";
      }

      return next;
    });

    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateRegisterForm(formData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error("Please fix the highlighted fields");
      return;
    }

    setLoading(true);

    try {
      const payload = buildRegisterPayload(formData);
      await registerUser(payload);
      toast.success("Registration successful! Please login.");
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4"
      data-testid="register-page"
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-2xl">
              <GraduationCap className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Create Account
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Join Smart UniAssistant
          </p>
        </div>

        <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-gray-200 dark:border-gray-800 shadow-xl">
          <CardHeader>
            <CardTitle>Register</CardTitle>
            <CardDescription>
              Create your account to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="name"
                    data-testid="name-input"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="pl-10"
                    aria-invalid={Boolean(errors.name)}
                  />
                </div>
                <FormFieldError message={errors.name} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="email"
                    data-testid="email-input"
                    type="email"
                    placeholder="your.email@student.sust.edu"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="pl-10"
                    aria-invalid={Boolean(errors.email)}
                  />
                </div>
                <FormFieldError message={errors.email} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="password"
                    data-testid="password-input"
                    type="password"
                    placeholder="At least 6 characters"
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    className="pl-10"
                    aria-invalid={Boolean(errors.password)}
                  />
                </div>
                <FormFieldError message={errors.password} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  data-testid="role-select"
                  value={formData.role}
                  onChange={(e) => handleChange("role", e.target.value)}
                  className={selectClassName}
                  aria-invalid={Boolean(errors.role)}
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="cr_admin">CR Admin</option>
                </select>
                <FormFieldError message={errors.role} />
              </div>

              {roleNeedsStudentId(formData.role) && (
                <div className="space-y-2">
                  <Label htmlFor="studentId">Student ID</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="studentId"
                      data-testid="student-id-input"
                      placeholder="2021331099"
                      value={formData.studentId}
                      onChange={(e) =>
                        handleChange("studentId", e.target.value)
                      }
                      className="pl-10"
                      aria-invalid={Boolean(errors.studentId)}
                    />
                  </div>
                  <FormFieldError message={errors.studentId} />
                </div>
              )}

              {formData.role === "teacher" && (
                <div className="space-y-2">
                  <Label htmlFor="teacherId">Teacher ID</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="teacherId"
                      data-testid="teacher-id-input"
                      placeholder="T12345"
                      value={formData.teacherId}
                      onChange={(e) =>
                        handleChange("teacherId", e.target.value)
                      }
                      className="pl-10"
                      aria-invalid={Boolean(errors.teacherId)}
                    />
                  </div>
                  <FormFieldError message={errors.teacherId} />
                </div>
              )}

              {(formData.role === "student" ||
                formData.role === "teacher" ||
                formData.role === "cr_admin") && (
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none z-10" />
                    <select
                      id="department"
                      data-testid="department-select"
                      value={formData.department}
                      onChange={(e) =>
                        handleChange("department", e.target.value)
                      }
                      className={`${selectClassName} pl-10`}
                      disabled={isCrAdmin && departmentsLoading}
                      aria-invalid={Boolean(errors.department)}
                    >
                      <option value="">
                        {isCrAdmin
                          ? departmentsLoading
                            ? "Loading departments..."
                            : "Select department"
                          : "Select department"}
                      </option>
                      {isCrAdmin
                        ? departments.map((department) => (
                            <option
                              key={department._id}
                              value={department._id}
                            >
                              {department.name} ({department.code})
                            </option>
                          ))
                        : DEPARTMENTS.map((department) => (
                            <option
                              key={department.value}
                              value={department.value}
                            >
                              {department.label}
                            </option>
                          ))}
                    </select>
                  </div>
                  <FormFieldError message={errors.department} />
                </div>
              )}

              {isStudent && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="semester">Semester</Label>
                    <select
                      id="semester"
                      data-testid="semester-select"
                      value={formData.semester}
                      onChange={(e) =>
                        handleChange("semester", e.target.value)
                      }
                      className={selectClassName}
                      aria-invalid={Boolean(errors.semester)}
                    >
                      <option value="">Select semester</option>
                      {SEMESTER_OPTIONS.map((semester) => (
                        <option key={semester} value={semester}>
                          Semester {semester}
                        </option>
                      ))}
                    </select>
                    <FormFieldError message={errors.semester} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="academicSession">Academic Session</Label>
                    <Input
                      id="academicSession"
                      data-testid="academic-session-input"
                      placeholder="e.g. 2021-22"
                      value={formData.academicSession}
                      onChange={(e) =>
                        handleChange("academicSession", e.target.value)
                      }
                      aria-invalid={Boolean(errors.academicSession)}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Use formats like 2021-22, 2022-23, 2023-24.
                    </p>
                    <FormFieldError message={errors.academicSession} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="section">Section</Label>
                    <select
                      id="section"
                      data-testid="section-select"
                      value={formData.section}
                      onChange={(e) => handleChange("section", e.target.value)}
                      className={selectClassName}
                    >
                      <option value="">Select section (optional)</option>
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                    </select>
                  </div>
                </>
              )}

              {needsBatch && (
                <div className="space-y-2">
                  <Label htmlFor="batch">Batch</Label>
                  <div className="relative">
                    <Layers className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none z-10" />
                    <select
                      id="batch"
                      data-testid="batch-select"
                      value={formData.batch}
                      onChange={(e) => handleChange("batch", e.target.value)}
                      className={`${selectClassName} pl-10`}
                      disabled={
                        !formData.department ||
                        batchesLoading ||
                        departmentsLoading
                      }
                      aria-invalid={Boolean(errors.batch)}
                    >
                      <option value="">
                        {!formData.department
                          ? "Select a department first"
                          : batchesLoading
                            ? "Loading batches..."
                            : "Select batch"}
                      </option>
                      {batches.map((batch) => (
                        <option key={batch._id} value={batch._id}>
                          {batch.name} ({batch.year})
                        </option>
                      ))}
                    </select>
                  </div>
                  <FormFieldError message={errors.batch} />
                  {formData.department &&
                    !batchesLoading &&
                    batches.length === 0 && (
                      <p className="text-sm text-amber-600 dark:text-amber-400">
                        No batches found for this department.
                      </p>
                    )}
                </div>
              )}

              <Button
                type="submit"
                data-testid="register-button"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading || (isCrAdmin && departmentsLoading)}
              >
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-blue-600 hover:underline font-medium"
                data-testid="login-link"
              >
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
