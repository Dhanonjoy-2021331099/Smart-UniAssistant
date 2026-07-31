import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Eye,
  FileEdit,
  Paperclip,
  Pin,
  User,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import NoticeFormModal from "../../components/notices/NoticeFormModal";
import {
  categoryStyles,
  priorityStyles,
  statusStyles,
  formatNoticeDate,
} from "../../components/notices/noticeMeta";
import {
  canManageNotices,
  canEditNotice,
  fetchNoticeById,
  getNoticeBasePath,
  updateNotice,
} from "../../services/notice.service";

const DetailsRow = ({ icon: Icon, label, children }) => (
  <div className="flex items-start gap-3">
    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
      <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
    </span>
    <div className="min-w-0">
      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {label}
      </p>
      <div className="text-sm text-gray-900 dark:text-white mt-0.5">{children}</div>
    </div>
  </div>
);

const getAttachments = (notice) => {
  if (Array.isArray(notice.attachments) && notice.attachments.length > 0) {
    return notice.attachments;
  }

  if (notice.attachment) {
    return [notice.attachment];
  }

  return [];
};

const NoticeDetails = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);

  const basePath = getNoticeBasePath(user?.role);
  const isManager = canManageNotices(user?.role);

  const {
    data: notice,
    isPending: loading,
    isError,
    error,
  } = useQuery({
    queryKey: ["notice", id],
    queryFn: () => fetchNoticeById(id),
  });

  const updateMutation = useMutation({
    mutationFn: ({ formData, onUploadProgress }) =>
      updateNotice(id, formData, onUploadProgress),
    onSuccess: () => {
      toast.success("Notice updated successfully");
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["notice", id] });
      queryClient.invalidateQueries({ queryKey: ["manage-notices"] });
    },
    onError: (err) =>
      toast.error(err.response?.data?.error || "Failed to update notice"),
  });

  const handleFormSubmit = (formData, callbacks) => {
    updateMutation.mutate({
      formData,
      onUploadProgress: callbacks?.onUploadProgress,
    });
  };

  if (loading) {
    return (
      <div className="space-y-4" data-testid="notice-details-skeleton">
        <div className="h-8 w-24 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="h-7 w-2/3 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
            <div className="h-3 w-1/2 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
            <div className="h-24 w-full rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
            <div className="h-3 w-full rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 p-6 text-center">
        <p className="text-red-700 dark:text-red-300 mb-4">
          {error?.response?.data?.error || error?.message || "Failed to load notice"}
        </p>
        <Button asChild variant="outline">
          <Link to={basePath}>Back to Notices</Link>
        </Button>
      </div>
    );
  }

  if (!notice) {
    return null;
  }

  const authorName = notice.authorName || notice.createdBy?.name || "Unknown";
  const attachments = getAttachments(notice);

  return (
    <div className="space-y-6" data-testid="notice-details-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Button asChild variant="ghost" className="w-fit">
          <Link to={basePath}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Notices
          </Link>
        </Button>

        {isManager && canEditNotice(user, notice) && (
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setModalOpen(true)}
          >
            <FileEdit className="w-4 h-4 mr-2" />
            Edit Notice
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {notice.isPinned && (
              <Badge className="bg-amber-500 text-white gap-1">
                <Pin className="w-3 h-3" />
                Pinned
              </Badge>
            )}
            <Badge className={categoryStyles[notice.category] || categoryStyles.General}>
              {notice.category}
            </Badge>
            <Badge className={priorityStyles[notice.priority] || priorityStyles.Normal}>
              {notice.priority}
            </Badge>
            {isManager && (
              <Badge className={statusStyles[notice.status]}>
                {notice.status}
              </Badge>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6">
            {notice.title}
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 mb-8">
            <DetailsRow icon={User} label="Author">
              {authorName}
            </DetailsRow>
            <DetailsRow icon={CalendarDays} label="Publish Date">
              {formatNoticeDate(notice.publishDate || notice.createdAt)}
            </DetailsRow>
            <DetailsRow icon={Clock} label="Expiry Date">
              {formatNoticeDate(notice.expiryDate)}
            </DetailsRow>
            <DetailsRow icon={Eye} label="Views">
              {notice.viewCount || 0}
            </DetailsRow>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              Description
            </p>
            <div className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
              {notice.description}
            </div>
          </div>

          {attachments.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-800 mt-6 pt-6">
              <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                Attachments ({attachments.length})
              </p>
              <div className="flex flex-wrap gap-3">
                {attachments.map((attachment, index) => (
                  <a
                    key={attachment.fileUrl || `${attachment.fileName}-${index}`}
                    href={attachment.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={attachment.fileName}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title={attachment.fileName}
                  >
                    <Paperclip className="w-4 h-4" />
                    {attachment.fileName}
                  </a>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {isManager && modalOpen && (
        <NoticeFormModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          initialValues={notice}
          onSubmit={handleFormSubmit}
          loading={updateMutation.isPending}
          title="Edit Notice"
          description="Update the notice details below."
        />
      )}
    </div>
  );
};

export default NoticeDetails;
