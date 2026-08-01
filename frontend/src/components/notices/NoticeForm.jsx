import { useState } from "react";
import { Pin } from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import DatePicker from "./DatePicker";
import { CATEGORIES, PRIORITIES } from "./noticeMeta";

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

const NoticeForm = ({
  initialValues = {},
  onSubmit,
  loading = false,
}) => {
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
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
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

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildPayload = (status) => {
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

    return payload;
  };

  const primaryButtonLabel = () => {
    if (loading) {
      return initialValues._id ? "Saving..." : "Publishing...";
    }

    return initialValues._id ? "Save Changes" : "Publish";
  };

  const handleSubmit = (event, status) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    onSubmit(buildPayload(status));
  };

  return (
    <form className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="notice-title">Notice Title</Label>
        <Input
          id="notice-title"
          value={formData.title}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="Enter notice title"
          disabled={loading}
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
          disabled={loading}
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
            disabled={loading}
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
            disabled={loading}
          >
            {PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </div>
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
          disabled={loading}
        />
        <Pin className="w-4 h-4 text-amber-500" />
        Pin this notice
      </label>

      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-2">
        <Button
          type="submit"
          variant="outline"
          onClick={(e) => handleSubmit(e, "draft")}
          disabled={loading}
        >
          {loading
            ? "Saving..."
            : initialValues.status === "draft"
              ? "Update Draft"
              : "Save as Draft"}
        </Button>
        <Button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700"
          onClick={(e) => handleSubmit(e, "published")}
          disabled={loading}
        >
          {primaryButtonLabel()}
        </Button>
      </div>
    </form>
  );
};

export default NoticeForm;
