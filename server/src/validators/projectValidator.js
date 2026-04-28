import {
  throwIfValidationFailed,
  validateDate,
  validateEnum,
  validateNumber,
  validateOptionalText,
  validateOptionalUrl,
  validateRequiredText,
} from "./common.js";

const propertyTypes = ["2 BHK", "3 BHK", "4 BHK", "villa", "plot", "office", "showroom"];
const projectStatuses = ["active", "sold out", "upcoming"];

export const validateProjectInput = (payload) => {
  const errors = {};

  const sizeMin = validateNumber(errors, "sizeRange.min", payload.sizeRange?.min, { label: "Minimum size", required: true, min: 1 });
  const sizeMax = validateNumber(errors, "sizeRange.max", payload.sizeRange?.max, { label: "Maximum size", required: true, min: 1 });
  const priceMin = validateNumber(errors, "priceRange.min", payload.priceRange?.min, { label: "Minimum price", required: true, min: 1 });
  const priceMax = validateNumber(errors, "priceRange.max", payload.priceRange?.max, { label: "Maximum price", required: true, min: 1 });
  const totalUnits = validateNumber(errors, "totalUnits", payload.totalUnits, { label: "Total units", required: true, min: 1, integer: true });
  const availableUnits = validateNumber(errors, "availableUnits", payload.availableUnits, { label: "Available units", required: true, min: 0, integer: true });

  const amenities =
    Array.isArray(payload.amenities)
      ? payload.amenities.map((item) => String(item).trim()).filter(Boolean)
      : String(payload.amenities || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);

  if (!amenities.length) {
    errors.amenities = "Amenities is required";
  }

  if (sizeMin !== undefined && sizeMax !== undefined && sizeMax < sizeMin) {
    errors["sizeRange.max"] = "Maximum size must be greater than or equal to minimum size";
  }

  if (priceMin !== undefined && priceMax !== undefined && priceMax < priceMin) {
    errors["priceRange.max"] = "Maximum price must be greater than or equal to minimum price";
  }

  if (totalUnits !== undefined && availableUnits !== undefined && availableUnits > totalUnits) {
    errors.availableUnits = "Available units cannot exceed total units";
  }

  const sanitized = {
    projectName: validateRequiredText(errors, "projectName", payload.projectName, { label: "Project name", min: 3, max: 100 }),
    publicAlias: validateRequiredText(errors, "publicAlias", payload.publicAlias, { label: "Client-safe alias", min: 3, max: 100 }),
    location: validateRequiredText(errors, "location", payload.location, { label: "Location", min: 2, max: 100 }),
    area: validateRequiredText(errors, "area", payload.area, { label: "Area", min: 2, max: 80 }),
    propertyType: validateEnum(errors, "propertyType", payload.propertyType, { label: "Property type", values: propertyTypes }),
    configuration: validateRequiredText(errors, "configuration", payload.configuration, { label: "Configuration", min: 3, max: 60 }),
    sizeRange: {
      min: sizeMin,
      max: sizeMax,
      unit: "sqft",
    },
    priceRange: {
      min: priceMin,
      max: priceMax,
      currencyLabel: "INR",
    },
    totalPlotSize: validateOptionalText(errors, "totalPlotSize", payload.totalPlotSize, { label: "Total plot size", max: 50 }) || undefined,
    totalBlocks: validateNumber(errors, "totalBlocks", payload.totalBlocks, { label: "Total blocks", required: true, min: 0, integer: true }),
    totalUnits,
    availableUnits,
    possessionDate: validateDate(errors, "possessionDate", payload.possessionDate, { label: "Possession date", required: true }),
    amenities,
    sampleHouseVideoUrl: validateOptionalUrl(errors, "sampleHouseVideoUrl", payload.sampleHouseVideoUrl, "Sample house video URL") || undefined,
    internalNotes: validateOptionalText(errors, "internalNotes", payload.internalNotes, { label: "Internal notes", max: 500 }) || undefined,
    builderDetails: validateOptionalText(errors, "builderDetails", payload.builderDetails, { label: "Builder details", max: 300 }) || undefined,
    status: validateEnum(errors, "status", payload.status || "active", { label: "Status", values: projectStatuses }),
  };

  throwIfValidationFailed(errors);
  return sanitized;
};
