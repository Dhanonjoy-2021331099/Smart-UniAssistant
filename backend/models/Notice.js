import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileSize: { type: Number },
  },
  { _id: false },
);

const noticeSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdByName: { type: String, required: true, trim: true },
  priority: {
    type: String,
    enum: ["Low", "Normal", "High"],
    default: "Normal",
  },
  attachments: {
    type: [attachmentSchema],
    default: [],
  },
  isPinned: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

noticeSchema.pre("save", function () {
  this.updatedAt = Date.now();
});

export default mongoose.model("Notice", noticeSchema);
