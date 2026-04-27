import mongoose from "mongoose";

const followupSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
    note: { type: String, required: true, trim: true, minlength: 3, maxlength: 500 },
    dueDate: { type: Date, required: true },
    type: {
      type: String,
      enum: ["call", "meeting", "site visit", "whatsapp", "email"],
      default: "call",
    },
    completed: { type: Boolean, default: false },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export const Followup = mongoose.model("Followup", followupSchema);
