import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Bell } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import NoticeCard from "../../components/notices/NoticeCard";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import {
  canEditNotice,
  canManageNotices,
  deleteNotice,
  fetchNotices,
  getNoticeBasePath,
} from "../../services/notice.service";

const NoticeList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const basePath = getNoticeBasePath(user?.role);
  const canManage = canManageNotices(user?.role);

  const loadNotices = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchNotices();
      setNotices(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load notices");
      toast.error("Failed to load notices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotices();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);

    try {
      await deleteNotice(deleteTarget._id);
      toast.success("Notice deleted successfully");
      setDeleteTarget(null);
      await loadNotices();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete notice");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 p-6 text-center">
        <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
        <Button onClick={loadNotices}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {canManage ? "Manage Notices" : "Notices"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {canManage
              ? "Create, update, and manage university notices"
              : "Latest announcements and updates"}
          </p>
        </div>

        {canManage && (
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => navigate(`${basePath}/create`)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Notice
          </Button>
        )}
      </div>

      {notices.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
          <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No notices yet
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {canManage
              ? "Create the first notice for your university community."
              : "Check back later for new announcements."}
          </p>
          {canManage && (
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link to={`${basePath}/create`}>Create Notice</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {notices.map((notice) => (
            <div key={notice._id} className="space-y-3">
              <NoticeCard
                notice={notice}
                detailsPath={`${basePath}/${notice._id}`}
              />

              {canManage && canEditNotice(user, notice) && (
                <div className="flex flex-wrap gap-2 pl-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`${basePath}/${notice._id}/edit`)}
                  >
                    Edit
                  </Button>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => setDeleteTarget(notice)}
                      >
                        Delete
                      </Button>
                    </DialogTrigger>
                    {deleteTarget?._id === notice._id && (
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete notice?</DialogTitle>
                          <DialogDescription>
                            This action cannot be undone. The notice &quot;
                            {notice.title}&quot; will be permanently removed.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex justify-end gap-3 mt-6">
                          <Button
                            variant="outline"
                            onClick={() => setDeleteTarget(null)}
                            disabled={deleting}
                          >
                            Cancel
                          </Button>
                          <Button
                            className="bg-red-600 hover:bg-red-700"
                            onClick={handleDelete}
                            disabled={deleting}
                          >
                            {deleting ? "Deleting..." : "Delete"}
                          </Button>
                        </div>
                      </DialogContent>
                    )}
                  </Dialog>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NoticeList;
