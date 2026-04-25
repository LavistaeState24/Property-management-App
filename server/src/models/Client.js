import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    requirement: { type: String, trim: true },
    budgetMin: Number,
    budgetMax: Number,
    preferredArea: { type: String, trim: true },
    propertyType: { type: String, trim: true },
    followUpDate: Date,
    status: {
      type: String,
      enum: ["new", "interested", "site visit", "negotiation", "closed", "lost"],
      default: "new",
    },
    notes: String,
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export const Client = mongoose.model("Client", clientSchema);

