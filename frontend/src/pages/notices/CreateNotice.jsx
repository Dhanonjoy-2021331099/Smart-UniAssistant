import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import NoticeForm from "../../components/notices/NoticeForm";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import {
  canManageNotices,
  createNotice,
  getNoticeBasePath,
} from "../../services/notice.service";

const CreateNotice = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const basePath = getNoticeBasePath(user?.role);

  if (!canManageNotices(user?.role)) {
    navigate(basePath);
    return null;
  }

  const handleSubmit = async (formData) => {
    setLoading(true);

    try {
      await createNotice(formData);
      toast.success("Notice created successfully");
      navigate(basePath);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to create notice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Create Notice
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Publish a new announcement for students and teachers
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notice Details</CardTitle>
        </CardHeader>
        <CardContent>
          <NoticeForm onSubmit={handleSubmit} loading={loading} submitLabel="Create Notice" />
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateNotice;
