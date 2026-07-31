import { Link } from "react-router-dom";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Eye, Paperclip, Pin, User } from "lucide-react";
import { cn } from "../../lib/utils";
import { categoryStyles, priorityStyles, formatNoticeDate } from "./noticeMeta";

const getAttachments = (notice) => {
  if (Array.isArray(notice.attachments) && notice.attachments.length > 0) {
    return notice.attachments;
  }

  if (notice.attachment) {
    return [notice.attachment];
  }

  return [];
};

const NoticeCard = ({ notice, detailsPath, compact = false, className }) => {
  const preview =
    notice.description?.length > 160
      ? `${notice.description.slice(0, 160)}...`
      : notice.description;

  const authorName = notice.authorName || notice.createdBy?.name || "Unknown";
  const attachments = getAttachments(notice);

  return (
    <article
      className={cn(
        "flex flex-col rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 hover:shadow-md transition-shadow",
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
            <Badge className={categoryStyles[notice.category] || categoryStyles.General}>
              {notice.category}
            </Badge>
            <Badge className={priorityStyles[notice.priority] || priorityStyles.Normal}>
              {notice.priority}
            </Badge>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {notice.title}
          </h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {formatNoticeDate(notice.publishDate || notice.createdAt)}
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

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            {authorName}
          </span>
          <span className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            {notice.viewCount || 0} views
          </span>
          {attachments.length > 0 && (
            <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
              <Paperclip className="w-3.5 h-3.5" />
              {attachments.length === 1
                ? `1 attachment`
                : `${attachments.length} attachments`}
            </span>
          )}
        </div>
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
