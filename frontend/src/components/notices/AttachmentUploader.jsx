import { useEffect, useMemo, useState } from "react";
import { FileText, ImagePlus, Paperclip, X } from "lucide-react";
import { cn } from "../../lib/utils";
import {
  formatFileSize,
  isImageFile,
  MAX_ATTACHMENT_COUNT,
  validateAttachmentFile,
} from "../../utils/fileUpload";

const useObjectUrls = (files) => {
  const urls = useMemo(
    () => new Map(files.map((file) => [file, URL.createObjectURL(file)])),
    [files],
  );

  useEffect(
    () => () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    },
    [urls],
  );

  return urls;
};

const NewFileItem = ({ file, url, onRemove }) => {
  const isImage = isImageFile(file);

  return (
    <li className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-2 pr-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800">
        {isImage && url ? (
          <img
            src={url}
            alt={file.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <FileText className="h-5 w-5 text-red-500" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
          {file.name}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {formatFileSize(file.size)}
        </p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="rounded-md p-1 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-red-500"
        aria-label={`Remove ${file.name}`}
        title="Remove"
      >
        <X className="w-4 h-4" />
      </button>
    </li>
  );
};

const ExistingFileItem = ({ attachment, onRemove }) => {
  const isImage = isImageFile({
    type: attachment.mimeType,
    name: attachment.fileName,
  });

  return (
    <li className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-2 pr-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800">
        {isImage && attachment.fileUrl ? (
          <img
            src={attachment.fileUrl}
            alt={attachment.fileName}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <FileText className="h-5 w-5 text-red-500" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
          {attachment.fileName}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {formatFileSize(attachment.fileSize)}
        </p>
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="rounded-md p-1 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-red-500"
          aria-label={`Remove ${attachment.fileName}`}
          title="Remove"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </li>
  );
};

const AttachmentUploader = ({
  files,
  onChange,
  existing = [],
  onRemoveExisting,
  disabled = false,
  className,
}) => {
  const [error, setError] = useState("");
  const urls = useObjectUrls(files);

  const totalCount = files.length + existing.length;

  const handleFilesSelected = (event) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = "";

    if (selected.length === 0) {
      return;
    }

    const invalid = selected
      .map(validateAttachmentFile)
      .find(Boolean);

    if (invalid) {
      setError(invalid);
      return;
    }

    if (totalCount + selected.length > MAX_ATTACHMENT_COUNT) {
      setError(`You can attach up to ${MAX_ATTACHMENT_COUNT} files.`);
      return;
    }

    setError("");
    onChange([...files, ...selected]);
  };

  const handleRemove = (index) => {
    onChange(files.filter((_, fileIndex) => fileIndex !== index));
  };

  return (
    <div className={cn("space-y-2", className)}>
      <label
        htmlFor="notice-attachments"
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-6 text-center cursor-pointer transition-colors hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        <ImagePlus className="w-8 h-8 text-gray-400" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
          Click to attach files
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          JPG, PNG, WEBP, GIF or PDF up to 10MB each (max {MAX_ATTACHMENT_COUNT})
        </span>
        <input
          id="notice-attachments"
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,image/jpeg,image/png,image/webp,image/gif,application/pdf"
          onChange={handleFilesSelected}
          className="sr-only"
          disabled={disabled}
        />
      </label>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {totalCount > 0 && (
        <ul className="space-y-2">
          {existing.map((attachment, index) => (
            <ExistingFileItem
              key={attachment._id || attachment.fileUrl || index}
              attachment={attachment}
              onRemove={
                onRemoveExisting ? () => onRemoveExisting(index) : undefined
              }
            />
          ))}
          {files.map((file, index) => (
            <NewFileItem
              key={`${file.name}-${file.lastModified}`}
              file={file}
              url={urls.get(file)}
              onRemove={() => handleRemove(index)}
            />
          ))}
        </ul>
      )}

      {totalCount === 0 && (
        <p className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
          <Paperclip className="w-3.5 h-3.5" />
          No attachments yet.
        </p>
      )}
    </div>
  );
};

export default AttachmentUploader;
