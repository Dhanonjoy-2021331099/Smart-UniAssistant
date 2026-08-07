import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    filePath: { type: String },
    fileSize: { type: Number },
  },
  { _id: false },
);

const noticeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["Academic", "Exam", "Assignment", "Event", "General"],
      default: "General",
    },
    priority: {
      type: String,
      enum: ["Normal", "Important", "Urgent"],
      default: "Normal",
    },
    attachments: { type: [attachmentSchema], default: [] },
    authorName: { type: String, required: true, trim: true },
    authorUID: { type: String, trim: true },
    authorRole: { type: String, required: true, trim: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    publishDate: { type: Date, default: Date.now },
    expiryDate: { type: Date },
    isPinned: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "published",
    },
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

noticeSchema.index({ status: 1, isPinned: -1, publishDate: -1 });
noticeSchema.index({ createdBy: 1, status: 1 });
noticeSchema.index({ category: 1 });

export default mongoose.model("Notice", noticeSchema);
