import { useEffect, useRef, useState } from "react";
import { Pin } from "lucide-react";
import { toast } from "sonner";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import DatePicker from "./DatePicker";
import AttachmentUploader from "./AttachmentUploader";
import { CATEGORIES, PRIORITIES } from "./noticeMeta";
import {
  MAX_ATTACHMENT_COUNT,
  prepareAttachmentFiles,
} from "../../utils/fileUpload";

const selectClassName =
  "flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500";

const toInputDate = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const toISODate = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00`);

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const normalizeExistingAttachments = (initialValues) => {
  if (Array.isArray(initialValues.attachments) && initialValues.attachments.length > 0) {
    return initialValues.attachments;
  }

  if (initialValues.attachment) {
    return [initialValues.attachment];
  }

  return [];
};

const NoticeForm = ({
  initialValues = {},
  onSubmit,
  loading = false,
}) => {
  const existing = normalizeExistingAttachments(initialValues);
  const [removedExisting, setRemovedExisting] = useState(() => new Set());

  const [formData, setFormData] = useState({
    title: initialValues.title || "",
    description: initialValues.description || "",
    category: initialValues.category || "General",
    priority: initialValues.priority || "Normal",
    publishDate:
      toInputDate(initialValues.publishDate) || toInputDate(new Date()),
    expiryDate: toInputDate(initialValues.expiryDate),
    isPinned: Boolean(initialValues.isPinned),
  });
  const [newFiles, setNewFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [progress, setProgress] = useState(0);
  const [preparing, setPreparing] = useState(false);
  const mountedRef = useRef(true);

  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    [],
  );

  const isBusy = loading || preparing;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleRemoveExisting = (index) => {
    setRemovedExisting((prev) => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  };

  const validate = () => {
    const nextErrors = {};

    if (!formData.title.trim()) {
      nextErrors.title = "Title is required";
    }

    if (!formData.description.trim()) {
      nextErrors.description = "Description is required";
    }

    if (
      formData.expiryDate &&
      formData.publishDate &&
      formData.expiryDate < formData.publishDate
    ) {
      nextErrors.expiryDate = "Expiry date cannot be before publish date";
    }

    if (existing.length + newFiles.length > MAX_ATTACHMENT_COUNT) {
      nextErrors.attachments = `You can attach up to ${MAX_ATTACHMENT_COUNT} files.`;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildPayload = (status, preparedFiles) => {
    const payload = new FormData();
    payload.append("title", formData.title.trim());
    payload.append("description", formData.description.trim());
    payload.append("category", formData.category);
    payload.append("priority", formData.priority);
    payload.append("status", status);
    payload.append("isPinned", String(formData.isPinned));

    const publishDate = toISODate(formData.publishDate);
    const expiryDate = toISODate(formData.expiryDate);

    if (publishDate) {
      payload.append("publishDate", publishDate);
    }

    if (expiryDate) {
      payload.append("expiryDate", expiryDate);
    }

    preparedFiles.forEach((file) => {
      payload.append("attachments", file);
    });

    const keptIndexes = existing
      .map((_, index) => index)
      .filter((index) => !removedExisting.has(index));

    payload.append("existingAttachments", JSON.stringify(keptIndexes));

    return payload;
  };

  const handleSubmit = async (event, status) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setProgress(0);
    setPreparing(true);

    try {
      const preparedFiles = await prepareAttachmentFiles(newFiles, (value) => {
        if (mountedRef.current) {
          setProgress(Math.round(value * 0.3));
        }
      });

      if (!mountedRef.current) {
        return;
      }

      setPreparing(false);

      onSubmit(buildPayload(status, preparedFiles), {
        onUploadProgress: (progressEvent) => {
          if (!mountedRef.current) {
            return;
          }

          const uploadPercent = progressEvent.total
            ? Math.round((progressEvent.loaded / progressEvent.total) * 100)
            : 100;

          setProgress(Math.round(30 + uploadPercent * 0.7));
        },
      });
    } catch {
      setPreparing(false);
      setProgress(0);
      toast.error("Failed to prepare attachments. Please try again.");
    }
  };

  const primaryButtonLabel = () => {
    if (preparing) {
      return "Preparing files...";
    }

    if (loading && progress > 0 && progress < 100) {
      return `Uploading ${progress}%`;
    }

    if (loading) {
      return initialValues._id ? "Saving..." : "Publishing...";
    }

    return initialValues._id ? "Save Changes" : "Publish";
  };

  const draftButtonLabel = () => {
    if (isBusy) {
      return preparing ? "Preparing files..." : "Saving...";
    }

    return initialValues.status === "draft" ? "Update Draft" : "Save as Draft";
  };

  const showProgress = isBusy && (preparing || progress > 0);

  return (
    <form className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="notice-title">Notice Title</Label>
        <Input
          id="notice-title"
          value={formData.title}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="Enter notice title"
          disabled={isBusy}
        />
        {errors.title && (
          <p className="text-sm text-red-600 dark:text-red-400">{errors.title}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notice-description">Notice Description</Label>
        <Textarea
          id="notice-description"
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Write the full notice details"
          className="min-h-[140px]"
          disabled={isBusy}
        />
        {errors.description && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {errors.description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="notice-category">Category</Label>
          <select
            id="notice-category"
            value={formData.category}
            onChange={(e) => handleChange("category", e.target.value)}
            className={selectClassName}
            disabled={isBusy}
          >
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notice-priority">Priority</Label>
          <select
            id="notice-priority"
            value={formData.priority}
            onChange={(e) => handleChange("priority", e.target.value)}
            className={selectClassName}
            disabled={isBusy}
          >
            {PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Attachments (optional)</Label>
        <AttachmentUploader
          files={newFiles}
          onChange={setNewFiles}
          existing={existing}
          onRemoveExisting={handleRemoveExisting}
          disabled={isBusy}
        />
        {errors.attachments && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {errors.attachments}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="notice-publish-date">Publish Date</Label>
          <DatePicker
            id="notice-publish-date"
            value={formData.publishDate}
            onChange={(value) => handleChange("publishDate", value)}
            minDate={toInputDate(new Date())}
            placeholder="Select publish date"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notice-expiry-date">Expiry Date</Label>
          <DatePicker
            id="notice-expiry-date"
            value={formData.expiryDate}
            onChange={(value) => handleChange("expiryDate", value)}
            minDate={formData.publishDate || toInputDate(new Date())}
            placeholder="Select expiry date"
          />
          {errors.expiryDate && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {errors.expiryDate}
            </p>
          )}
        </div>
      </div>

      <label className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
        <input
          type="checkbox"
          checked={formData.isPinned}
          onChange={(e) => handleChange("isPinned", e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          disabled={isBusy}
        />
        <Pin className="w-4 h-4 text-amber-500" />
        Pin this notice
      </label>

      {showProgress && (
        <div className="space-y-1.5">
          <Progress value={progress} />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {preparing ? "Compressing images..." : `Uploading... ${progress}%`}
          </p>
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-2">
        <Button
          type="submit"
          variant="outline"
          onClick={(e) => handleSubmit(e, "draft")}
          disabled={isBusy}
        >
          {draftButtonLabel()}
        </Button>
        <Button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700"
          onClick={(e) => handleSubmit(e, "published")}
          disabled={isBusy}
        >
          {primaryButtonLabel()}
        </Button>
      </div>
    </form>
  );
};

export default NoticeForm;
