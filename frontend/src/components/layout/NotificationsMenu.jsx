import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../services/notification.service";
import { getSocket, disconnectSocket } from "../../services/socket";
import { getNoticeBasePath } from "../../services/notice.service";

const formatRelativeTime = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const seconds = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 1000),
  );

  if (seconds < 60) {
    return "just now";
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days}d ago`;
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

const NotificationsMenu = ({ user }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const {
    data,
    isLoading,
    refetch: refresh,
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    refetchOnWindowFocus: false,
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  useEffect(() => {
    const socket = getSocket();

    if (socket) {
      socket.on("notice:published", refresh);
      socket.on("schedule:published", refresh);
      socket.on("schedule:updated", refresh);
      socket.on("result:published", refresh);
      socket.on("result:updated", refresh);
    }

    return () => {
      if (socket) {
        socket.off("notice:published", refresh);
        socket.off("schedule:published", refresh);
        socket.off("schedule:updated", refresh);
        socket.off("result:published", refresh);
        socket.off("result:updated", refresh);
      }

      disconnectSocket();
    };
  }, [refresh]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleOpenNotification = (notification) => {
    if (!notification.isRead) {
      markReadMutation.mutate(notification._id);
    }

    setOpen(false);

    if (notification.link) {
      navigate(notification.link);
    } else if (notification.scheduleId) {
      navigate("/student/schedule");
    } else if (notification.noticeId) {
      const basePath = getNoticeBasePath(user?.role);
      navigate(`${basePath}/${notification.noticeId}`);
    }
  };

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate();
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((current) => !current)}
        data-testid="notifications-button"
        aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ""}`}
        aria-expanded={open}
        className="h-10 w-10 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
      >
        <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        {unreadCount > 0 && (
          <Badge
            className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center p-0 text-xs"
            data-testid="notification-badge"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-4 top-16 z-50 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg sm:absolute sm:inset-auto sm:top-auto sm:right-0 sm:mt-2 sm:w-96">
          <div className="flex items-center justify-between gap-2 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Notifications
            </p>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-blue-600 dark:text-blue-400"
                onClick={handleMarkAllRead}
                disabled={markAllReadMutation.isPending}
              >
                <CheckCheck className="w-3.5 h-3.5 mr-1" />
                Mark all as read
              </Button>
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {isLoading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-14 rounded-md bg-gray-100 dark:bg-gray-800 animate-pulse"
                  />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No notifications yet
                </p>
              </div>
            ) : (
              <ul>
                {notifications.map((notification) => (
                  <li key={notification._id}>
                    <button
                      type="button"
                      onClick={() => handleOpenNotification(notification)}
                      className={`w-full px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                        notification.isRead
                          ? ""
                          : "bg-blue-50 dark:bg-blue-950/30"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {!notification.isRead && (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {notification.title}
                          </p>
                          <p className="mt-0.5 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
                            {notification.message}
                          </p>
                          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                            {formatRelativeTime(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsMenu;
