import mongoose from "mongoose";

const assetSchema = new mongoose.Schema(
  {
    name: String,
    url: String,
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    projectName: { type: String, required: true, trim: true },
    publicAlias: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    area: { type: String, trim: true },
    propertyType: {
      type: String,
      enum: ["2 BHK", "3 BHK", "4 BHK", "villa", "plot", "office", "showroom"],
      required: true,
    },
    configuration: { type: String, trim: true },
    sizeRange: {
      min: Number,
      max: Number,
      unit: { type: String, default: "sqft" },
    },
    priceRange: {
      min: Number,
      max: Number,
      currencyLabel: { type: String, default: "INR" },
    },
    totalPlotSize: String,
    totalBlocks: Number,
    totalUnits: Number,
    availableUnits: Number,
    possessionDate: Date,
    amenities: [String],
    floorPlans: [assetSchema],
    brochure: assetSchema,
    sampleHouseVideoUrl: String,
    projectImages: [assetSchema],
    internalNotes: String,
    builderDetails: String,
    status: {
      type: String,
      enum: ["active", "sold out", "upcoming"],
      default: "active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export const Project = mongoose.model("Project", projectSchema);

