import mongoose from "mongoose";

const dailyWorkUpdateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    reportDate: {
      type: Date,
      required: true,
      index: true,
    },
    achievements: { type: String, required: true, trim: true, minlength: 3, maxlength: 3000 },
    pendingWork: { type: String, required: true, trim: true, minlength: 3, maxlength: 3000 },
    tomorrowPlan: { type: String, required: true, trim: true, minlength: 3, maxlength: 3000 },
    blockers: { type: String, trim: true, maxlength: 2000, default: "" },
    additionalNotes: { type: String, trim: true, maxlength: 2000, default: "" },
    status: {
      type: String,
      enum: ["Draft", "Submitted", "Reviewed"],
      default: "Draft",
      index: true,
    },
    managerComment: { type: String, trim: true, maxlength: 2000, default: "" },
    submittedAt: { type: Date, default: null },
    reviewedAt: { type: Date, default: null },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

dailyWorkUpdateSchema.index({ userId: 1, reportDate: 1 }, { unique: true });

export const DailyWorkUpdate = mongoose.model("DailyWorkUpdate", dailyWorkUpdateSchema);
