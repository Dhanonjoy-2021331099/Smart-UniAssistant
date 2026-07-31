import React, { useState } from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";

const selectClassName =
  "flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500";

const NoticeForm = ({
  initialValues = {},
  onSubmit,
  submitLabel = "Save Notice",
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    title: initialValues.title || "",
    description: initialValues.description || "",
    priority: initialValues.priority || "Normal",
    isPinned: Boolean(initialValues.isPinned),
    attachment: null,
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

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    const payload = new FormData();
    payload.append("title", formData.title.trim());
    payload.append("description", formData.description.trim());
    payload.append("priority", formData.priority);
    payload.append("isPinned", String(formData.isPinned));

    if (formData.attachment) {
      payload.append("attachment", formData.attachment);
    }

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="Enter notice title"
        />
        {errors.title && (
          <p className="text-sm text-red-600 dark:text-red-400">{errors.title}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Write the full notice details"
          className="min-h-[140px]"
        />
        {errors.description && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {errors.description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <select
            id="priority"
            value={formData.priority}
            onChange={(e) => handleChange("priority", e.target.value)}
            className={selectClassName}
          >
            <option value="Low">Low</option>
            <option value="Normal">Normal</option>
            <option value="High">High</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="attachment">Attachment (optional)</Label>
          <Input
            id="attachment"
            type="file"
            onChange={(e) => handleChange("attachment", e.target.files?.[0] || null)}
          />
        </div>
      </div>

      <label className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
        <input
          type="checkbox"
          checked={formData.isPinned}
          onChange={(e) => handleChange("isPinned", e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        Pin this notice
      </label>

      <Button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700"
        disabled={loading}
      >
        {loading ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
};

export default NoticeForm;
