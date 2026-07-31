import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  Bell,
  Eye,
  FileEdit,
  MoreHorizontal,
  Pin,
  PinOff,
  Plus,
  Search,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent } from "../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import NoticeFormModal from "../../components/notices/NoticeFormModal";
import {
  categoryStyles,
  priorityStyles,
  statusStyles,
  formatNoticeDate,
  CATEGORIES,
  PRIORITIES,
} from "../../components/notices/noticeMeta";
import {
  createNotice,
  deleteNotice,
  fetchNotices,
  getNoticeBasePath,
  togglePinNotice,
  updateNotice,
  updateNoticeStatus,
} from "../../services/notice.service";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const PAGE_SIZE = 10;

const TableSkeleton = () => (
  <div className="space-y-3" data-testid="notices-table-skeleton">
    {Array.from({ length: 6 }).map((_, index) => (
      <div
        key={index}
        className="h-14 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse"
      />
    ))}
  </div>
);

const ManageNotices = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");

  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [debouncedCategory, setDebouncedCategory] = useState("");
  const [debouncedPriority, setDebouncedPriority] = useState("");
  const [debouncedStatus, setDebouncedStatus] = useState("");

  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const basePath = getNoticeBasePath(user?.role);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setDebouncedCategory(category);
      setDebouncedPriority(priority);
      setDebouncedStatus(status);
      setPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [search, category, priority, status]);

  const {
    data: noticesData,
    isPending: loading,
    isError,
    error,
    refetch: loadNotices,
  } = useQuery({
    queryKey: [
      "manage-notices",
      debouncedSearch,
      debouncedCategory,
      debouncedPriority,
      debouncedStatus,
      page,
    ],
    queryFn: () =>
      fetchNotices({
        search: debouncedSearch || undefined,
        category: debouncedCategory || undefined,
        priority: debouncedPriority || undefined,
        status: debouncedStatus || undefined,
        page,
        limit: PAGE_SIZE,
      }),
  });

  const notices = noticesData?.notices || [];
  const total = noticesData?.total || 0;
  const pages = noticesData?.pages || 1;

  const refreshNotices = () =>
    queryClient.invalidateQueries({ queryKey: ["manage-notices"] });

  const saveMutation = useMutation({
    mutationFn: ({ noticeId, formData, onUploadProgress }) =>
      noticeId
        ? updateNotice(noticeId, formData, onUploadProgress)
        : createNotice(formData, onUploadProgress),
    onSuccess: (_result, variables) => {
      toast.success(
        variables.noticeId ? "Notice updated successfully" : "Notice created successfully",
      );
      setModalOpen(false);
      setEditingNotice(null);
      refreshNotices();
    },
    onError: (err) =>
      toast.error(err.response?.data?.error || "Failed to save notice"),
  });

  const pinMutation = useMutation({
    mutationFn: (noticeId) => togglePinNotice(noticeId),
    onSuccess: (result) => {
      toast.success(result.isPinned ? "Notice pinned" : "Notice unpinned");
      refreshNotices();
    },
    onError: (err) =>
      toast.error(err.response?.data?.error || "Failed to update pin status"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ noticeId, nextStatus }) =>
      updateNoticeStatus(noticeId, nextStatus),
    onSuccess: (_result, variables) => {
      toast.success(
        variables.nextStatus === "archived"
          ? "Notice archived"
          : "Notice published",
      );
      refreshNotices();
    },
    onError: (err) =>
      toast.error(err.response?.data?.error || "Failed to update status"),
  });

  const deleteMutation = useMutation({
    mutationFn: (noticeId) => deleteNotice(noticeId),
    onSuccess: () => {
      toast.success("Notice deleted successfully");
      setDeleteTarget(null);

      if (notices.length === 1 && page > 1) {
        setPage((current) => Math.max(current - 1, 1));
      } else {
        refreshNotices();
      }
    },
    onError: (err) =>
      toast.error(err.response?.data?.error || "Failed to delete notice"),
  });

  const openCreateModal = () => {
    setEditingNotice(null);
    setModalOpen(true);
  };

  const openEditModal = (notice) => {
    setEditingNotice(notice);
    setModalOpen(true);
  };

  const handleFormSubmit = (formData, callbacks) => {
    saveMutation.mutate({
      noticeId: editingNotice?._id,
      formData,
      onUploadProgress: callbacks?.onUploadProgress,
    });
  };

  const handleTogglePin = (notice) => {
    pinMutation.mutate(notice._id);
  };

  const handleArchive = (notice) => {
    statusMutation.mutate({
      noticeId: notice._id,
      nextStatus: notice.status === "archived" ? "published" : "archived",
    });
  };

  const handleDelete = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget._id);
    }
  };

  const getStatusActionLabel = (notice) =>
    notice.status === "published" ? "Archive" : "Publish";

  const getStatusActionIcon = (notice) =>
    notice.status === "published" ? (
      <Archive className="mr-2 h-4 w-4" />
    ) : (
      <Send className="mr-2 h-4 w-4" />
    );

  const selectClassName =
    "h-10 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="space-y-6" data-testid="manage-notices-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Manage Notices
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create, publish, and manage notices for your batch
          </p>
        </div>

        <Button className="bg-blue-600 hover:bg-blue-700" onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-2" />
          Create Notice
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search notices by title or description..."
                className="pl-10"
                data-testid="notices-search"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={selectClassName}
                aria-label="Filter by category"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className={selectClassName}
                aria-label="Filter by priority"
              >
                <option value="">All Priorities</option>
                {PRIORITIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={selectClassName}
                aria-label="Filter by status"
              >
                {STATUS_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <TableSkeleton />
          ) : isError ? (
            <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 p-6 text-center">
              <p className="text-red-700 dark:text-red-300 mb-4">
                {error?.response?.data?.error || error?.message || "Failed to load notices"}
              </p>
              <Button onClick={() => loadNotices()}>Try Again</Button>
            </div>
          ) : notices.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No notices found
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {search || category || priority || status
                  ? "Try adjusting your search or filters."
                  : "Create the first notice for your batch."}
              </p>
              {!search && !category && !priority && !status && (
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={openCreateModal}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Notice
                </Button>
              )}
            </div>
          ) : (
            <Table data-testid="notices-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pinned</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notices.map((notice) => (
                  <TableRow key={notice._id}>
                    <TableCell className="max-w-[280px]">
                      <button
                        onClick={() => navigate(`${basePath}/${notice._id}`)}
                        className="text-left font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 line-clamp-1"
                        title={notice.title}
                      >
                        {notice.title}
                      </button>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={categoryStyles[notice.category] || categoryStyles.General}
                      >
                        {notice.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={priorityStyles[notice.priority] || priorityStyles.Normal}
                      >
                        {notice.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusStyles[notice.status]}>
                        {notice.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {notice.isPinned ? (
                        <Badge className="bg-amber-500 text-white gap-1">
                          <Pin className="w-3 h-3" />
                          Pinned
                        </Badge>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-600">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-700 dark:text-gray-300">
                      {notice.viewCount || 0}
                    </TableCell>
                    <TableCell className="text-gray-700 dark:text-gray-300">
                      {formatNoticeDate(notice.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="View"
                          onClick={() => navigate(`${basePath}/${notice._id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="More actions"
                              data-testid="notice-actions"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openEditModal(notice)}>
                              <FileEdit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleTogglePin(notice)}>
                              {notice.isPinned ? (
                                <>
                                  <PinOff className="mr-2 h-4 w-4" />
                                  Unpin
                                </>
                              ) : (
                                <>
                                  <Pin className="mr-2 h-4 w-4" />
                                  Pin
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleArchive(notice)}>
                              {getStatusActionIcon(notice)}
                              {getStatusActionLabel(notice)}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600 dark:text-red-400"
                              onClick={() => setDeleteTarget(notice)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!loading && !isError && notices.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing {notices.length} of {total} notices
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(current - 1, 1))}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {page} of {pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pages}
                  onClick={() => setPage((current) => Math.min(current + 1, pages))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {modalOpen && (
        <NoticeFormModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          initialValues={editingNotice || {}}
          onSubmit={handleFormSubmit}
          loading={saveMutation.isPending}
          title={editingNotice ? "Edit Notice" : "Create Notice"}
          description={
            editingNotice
              ? "Update the notice details below."
              : "Fill in the details below to create a notice."
          }
        />
      )}

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(value) => !value && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete notice?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The notice &quot;
              {deleteTarget?.title}&quot; will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageNotices;
