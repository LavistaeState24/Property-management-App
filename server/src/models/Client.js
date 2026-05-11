import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    ownerName: { type: String, required: true, trim: true, minlength: 3, maxlength: 80 },
    address: { type: String, required: true, trim: true, minlength: 5, maxlength: 200 },
    premiseName: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    premiseArea: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    sourceOfProperty: {
      type: String,
      required: true,
      trim: true,
      enum: ["Owner", "Broker"],
    },
    propertyType: {
      type: String,
      required: true,
      trim: true,
      enum: ["1BHK", "2BHK", "3BHK", "4BHK", "Penthouse", "Raw House", "Tenament", "Bungalow"],
    },
    ownerPrice: { type: Number, required: true, min: 0 },
    propertyCondition: {
      type: String,
      required: true,
      trim: true,
      enum: ["Unfurnished", "Semi Furnished", "Furnished", "Fully Furnished"],
    },
    propertyAge: { type: String, required: true, trim: true, minlength: 1, maxlength: 80 },
    propertySize: { type: String, required: true, trim: true, minlength: 1, maxlength: 80 },
    clientPhoneNumber: { type: String, required: true, trim: true, match: /^[6-9]\d{9}$/ },
    internalNotes: { type: String, trim: true, maxlength: 500, default: "" },
    propertyStatus: {
      type: String,
      required: true,
      trim: true,
      enum: ["Available", "Hold", "Sold", "Rent Out", "Not Available"],
    },
    dateOfAddingProperty: { type: Date, required: true },
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
