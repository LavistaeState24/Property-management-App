import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 3, maxlength: 60 },
    phone: { type: String, required: true, trim: true, match: /^[6-9]\d{9}$/ },
    email: { type: String, trim: true, lowercase: true, maxlength: 120, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    requirement: { type: String, required: true, trim: true, minlength: 5, maxlength: 160 },
    budgetMin: { type: Number, min: 0 },
    budgetMax: {
      type: Number,
      min: 0,
      validate: {
        validator(value) {
          return value === undefined || value >= (this.budgetMin ?? 0);
        },
        message: "Maximum budget must be greater than or equal to minimum budget",
      },
    },
    preferredArea: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    propertyType: {
      type: String,
      required: true,
      trim: true,
      enum: ["1 BHK", "2 BHK", "3 BHK", "4 BHK", "villa", "plot", "office", "showroom"],
    },
    followUpDate: Date,
    status: {
      type: String,
      enum: ["new", "interested", "site visit", "negotiation", "closed", "lost"],
      default: "new",
    },
    notes: { type: String, trim: true, maxlength: 500 },
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
