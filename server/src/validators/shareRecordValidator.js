import {
  throwIfValidationFailed,
  validateDate,
  validateEmail,
  validateEnum,
  validateObjectId,
  validateOptionalText,
  validateOptionalUrl,
  validatePhone,
  validateRequiredText,
} from "./common.js";

const shareStatuses = ["shared", "interested", "follow-up", "site-visit", "closed", "not-interested"];

export const validateShareRecordCreateInput = (payload) => {
  const errors = {};
  const shareTargetType = validateEnum(errors, "shareTargetType", payload.shareTargetType || "project", {
    label: "Share target type",
    values: ["project", "lead-property"],
  });

  const amenities = Array.isArray(payload.sharedFields?.amenities)
    ? payload.sharedFields.amenities.map((item) => String(item).trim()).filter(Boolean)
    : [];
  const photos = Array.isArray(payload.sharedFields?.photos)
    ? payload.sharedFields.photos.map((item) => String(item).trim()).filter(Boolean)
    : [];

  const sanitized = {
    shareTargetType,
    clientName: validateRequiredText(errors, "clientName", payload.clientName, { label: "Client name", min: 3, max: 60 }),
    clientPhone: validatePhone(errors, "clientPhone", payload.clientPhone),
    clientEmail: validateEmail(errors, "clientEmail", payload.clientEmail, { required: false }) || undefined,
    clientRequirement: validateOptionalText(errors, "clientRequirement", payload.clientRequirement, { label: "Client requirement", max: 200 }) || undefined,
    projectId:
      shareTargetType === "project"
        ? validateObjectId(errors, "projectId", payload.projectId, { label: "Project" })
        : undefined,
    projectPublicAlias:
      shareTargetType === "project"
        ? validateRequiredText(errors, "projectPublicAlias", payload.projectPublicAlias, { label: "Project alias", min: 3, max: 100 })
        : undefined,
    leadPropertyId:
      shareTargetType === "lead-property"
        ? validateObjectId(errors, "leadPropertyId", payload.leadPropertyId, { label: "Lead property" })
        : undefined,
    sharedTitle:
      shareTargetType === "lead-property"
        ? validateRequiredText(errors, "sharedTitle", payload.sharedTitle, { label: "Property title", min: 3, max: 120 })
        : undefined,
    sharedFields: {
      area: validateOptionalText(errors, "sharedFields.area", payload.sharedFields?.area, { label: "Area", max: 120 }) || undefined,
      propertyType: validateOptionalText(errors, "sharedFields.propertyType", payload.sharedFields?.propertyType, { label: "Property type", max: 80 }) || undefined,
      purpose: validateOptionalText(errors, "sharedFields.purpose", payload.sharedFields?.purpose, { label: "Purpose", max: 80 }) || undefined,
      configuration: validateOptionalText(errors, "sharedFields.configuration", payload.sharedFields?.configuration, { label: "Configuration", max: 80 }) || undefined,
      size: validateOptionalText(errors, "sharedFields.size", payload.sharedFields?.size, { label: "Size", max: 80 }) || undefined,
      priceRange: validateOptionalText(errors, "sharedFields.priceRange", payload.sharedFields?.priceRange, { label: "Price range", max: 120 }) || undefined,
      possession: validateOptionalText(errors, "sharedFields.possession", payload.sharedFields?.possession, { label: "Possession", max: 80 }) || undefined,
      furnishingStatus: validateOptionalText(errors, "sharedFields.furnishingStatus", payload.sharedFields?.furnishingStatus, { label: "Furnishing status", max: 80 }) || undefined,
      propertyStatus: validateOptionalText(errors, "sharedFields.propertyStatus", payload.sharedFields?.propertyStatus, { label: "Property status", max: 80 }) || undefined,
      description: validateOptionalText(errors, "sharedFields.description", payload.sharedFields?.description, { label: "Description", max: 1500 }) || undefined,
      amenities,
      brochureUrl: validateOptionalUrl(errors, "sharedFields.brochureUrl", payload.sharedFields?.brochureUrl, "Brochure URL") || undefined,
      sampleVideoUrl: validateOptionalUrl(errors, "sharedFields.sampleVideoUrl", payload.sharedFields?.sampleVideoUrl, "Sample house video URL") || undefined,
      photos: photos.map((photo, index) => validateOptionalUrl(errors, `sharedFields.photos.${index}`, photo, "Photo URL")).filter(Boolean),
    },
    shareChannel: validateEnum(errors, "shareChannel", payload.shareChannel || "WhatsApp", { label: "Share channel", values: ["WhatsApp"] }),
    whatsappMessage: validateRequiredText(errors, "whatsappMessage", payload.whatsappMessage, { label: "WhatsApp message", min: 10, max: 4000 }),
    status: validateEnum(errors, "status", payload.status || "shared", { label: "Status", values: shareStatuses }),
    followUpDate: validateDate(errors, "followUpDate", payload.followUpDate, { label: "Follow-up date" }) || undefined,
    notes: validateOptionalText(errors, "notes", payload.notes, { label: "Notes", max: 1000 }) || undefined,
  };

  throwIfValidationFailed(errors);
  return sanitized;
};

export const validateShareRecordStatusInput = (payload) => {
  const errors = {};

  const sanitized = {
    status: validateEnum(errors, "status", payload.status, { label: "Status", values: shareStatuses }),
    followUpDate: validateDate(errors, "followUpDate", payload.followUpDate, { label: "Follow-up date" }) || undefined,
  };

  throwIfValidationFailed(errors);
  return sanitized;
};

export const validateShareRecordNotesInput = (payload) => {
  const errors = {};

  const sanitized = {
    notes: validateOptionalText(errors, "notes", payload.notes, { label: "Notes", max: 1000 }) || "",
    followUpDate: validateDate(errors, "followUpDate", payload.followUpDate, { label: "Follow-up date" }) || undefined,
  };

  throwIfValidationFailed(errors);
  return sanitized;
};
