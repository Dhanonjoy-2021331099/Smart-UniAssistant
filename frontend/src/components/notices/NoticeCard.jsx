import React from "react";
import { Link } from "react-router-dom";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Pin } from "lucide-react";
import { cn } from "../../lib/utils";

const priorityStyles = {
  Low: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  Normal: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  High: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const NoticeCard = ({
  notice,
  detailsPath,
  compact = false,
  className,
}) => {
  const preview =
    notice.description?.length > 160
      ? `${notice.description.slice(0, 160)}...`
      : notice.description;

  return (
    <article
      className={cn(
        "rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 hover:shadow-md transition-shadow",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {notice.isPinned && (
              <Badge className="bg-amber-500 text-white gap-1">
                <Pin className="w-3 h-3" />
                Pinned
              </Badge>
            )}
            <Badge className={priorityStyles[notice.priority] || priorityStyles.Normal}>
              {notice.priority}
            </Badge>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {notice.title}
          </h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {new Date(notice.createdAt).toLocaleDateString()}
        </p>
      </div>

      {!compact && (
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 whitespace-pre-wrap">
          {preview}
        </p>
      )}

      {compact && (
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
          {preview}
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          By {notice.createdByName || notice.createdBy?.name || "Unknown"}
        </p>
        {detailsPath && (
          <Button asChild variant="outline" size="sm">
            <Link to={detailsPath}>Read More</Link>
          </Button>
        )}
      </div>
    </article>
  );
};

export default NoticeCard;
