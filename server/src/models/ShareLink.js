import crypto from "crypto";
import mongoose from "mongoose";

const shareLinkSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    sharedWithClientName: String,
    token: {
      type: String,
      unique: true,
      default: () => crypto.randomBytes(12).toString("hex"),
    },
    selectedFields: [String],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    expiresAt: Date,
  },
  { timestamps: true }
);

export const ShareLink = mongoose.model("ShareLink", shareLinkSchema);

