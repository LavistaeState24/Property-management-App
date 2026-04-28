import mongoose from "mongoose";

const sharedFieldsSchema = new mongoose.Schema(
  {
    area: { type: String, trim: true, maxlength: 120 },
    configuration: { type: String, trim: true, maxlength: 80 },
    size: { type: String, trim: true, maxlength: 80 },
    priceRange: { type: String, trim: true, maxlength: 120 },
    possession: { type: String, trim: true, maxlength: 80 },
    amenities: [{ type: String, trim: true, maxlength: 80 }],
    brochureUrl: { type: String, trim: true, maxlength: 500, default: null },
    sampleVideoUrl: { type: String, trim: true, maxlength: 500, default: null },
    photos: [{ type: String, trim: true, maxlength: 500 }],
  },
  { _id: false }
);

const shareRecordSchema = new mongoose.Schema(
  {
    clientName: { type: String, required: true, trim: true, minlength: 3, maxlength: 60 },
    clientPhone: { type: String, required: true, trim: true, match: /^[6-9]\d{9}$/ },
    clientEmail: { type: String, trim: true, lowercase: true, maxlength: 120, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    clientRequirement: { type: String, trim: true, maxlength: 200 },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    projectPublicAlias: { type: String, required: true, trim: true, maxlength: 100 },
    sharedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sharedByName: { type: String, required: true, trim: true, maxlength: 60 },
    sharedByPhone: { type: String, required: true, trim: true, match: /^[6-9]\d{9}$/ },
    sharedFields: { type: sharedFieldsSchema, required: true },
    shareChannel: {
      type: String,
      enum: ["WhatsApp"],
      default: "WhatsApp",
    },
    whatsappMessage: { type: String, required: true, trim: true, maxlength: 4000 },
    status: {
      type: String,
      enum: ["shared", "interested", "follow-up", "site-visit", "closed", "not-interested"],
      default: "shared",
    },
    followUpDate: Date,
    notes: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

shareRecordSchema.index({ clientPhone: 1, createdAt: -1 });
shareRecordSchema.index({ projectId: 1, createdAt: -1 });

export const ShareRecord = mongoose.model("ShareRecord", shareRecordSchema);
