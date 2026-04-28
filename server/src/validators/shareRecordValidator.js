import {
  throwIfValidationFailed,
  validateDate,
  validateEmail,
  validateEnum,
  validateObjectId,
  validateOptionalText,
  validatePhone,
  validateRequiredText,
} from "./common.js";

const shareStatuses = ["shared", "interested", "follow-up", "site-visit", "closed", "not-interested"];

export const validateCreateShareRecordInput = (payload) => {
  const errors = {};

  const photos = Array.isArray(payload.sharedFields?.photos)
    ? payload.sharedFields.photos.filter(Boolean)
    : [];

  const sharedFields = {
    area: validateRequiredText(errors, "sharedFields.area", payload.sharedFields?.area, {
      label: "Area",
      min: 2,
      max: 120,
    }),
    configuration: validateRequiredText(errors, "sharedFields.configuration", payload.sharedFields?.configuration, {
      label: "Configuration",
      min: 2,
      max: 80,
    }),
    size: validateOptionalText(errors, "sharedFields.size", payload.sharedFields?.size, {
      label: "Size",
      max: 80,
    }) || undefined,
    priceRange: validateOptionalText(errors, "sharedFields.priceRange", payload.sharedFields?.priceRange, {
      label: "Price range",
      max: 120,
    }) || undefined,
    possession: validateOptionalText(errors, "sharedFields.possession", payload.sharedFields?.possession, {
      label: "Possession",
      max: 80,
    }) || undefined,
    amenities: Array.isArray(payload.sharedFields?.amenities)
      ? payload.sharedFields.amenities.map((item) => String(item).trim()).filter(Boolean)
      : [],
    brochureUrl: validateOptionalText(errors, "sharedFields.brochureUrl", payload.sharedFields?.brochureUrl, {
      label: "Brochure URL",
      max: 500,
    }) || null,
    sampleVideoUrl: validateOptionalText(errors, "sharedFields.sampleVideoUrl", payload.sharedFields?.sampleVideoUrl, {
      label: "Sample video URL",
      max: 500,
    }) || null,
    photos,
  };

  const sanitized = {
    clientName: validateRequiredText(errors, "clientName", payload.clientName, { label: "Client name", min: 3, max: 60 }),
    clientPhone: validatePhone(errors, "clientPhone", payload.clientPhone),
    clientEmail: validateEmail(errors, "clientEmail", payload.clientEmail, { required: false }) || undefined,
    clientRequirement: validateOptionalText(errors, "clientRequirement", payload.clientRequirement, {
      label: "Client requirement",
      max: 200,
    }) || undefined,
    projectId: validateObjectId(errors, "projectId", payload.projectId, { label: "Project" }),
    projectPublicAlias: validateRequiredText(errors, "projectPublicAlias", payload.projectPublicAlias, {
      label: "Project alias",
      min: 2,
      max: 100,
    }),
    sharedBy: validateObjectId(errors, "sharedBy", payload.sharedBy, { label: "Shared by" }),
    sharedByName: validateRequiredText(errors, "sharedByName", payload.sharedByName, { label: "Shared by name", min: 3, max: 60 }),
    sharedByPhone: validatePhone(errors, "sharedByPhone", payload.sharedByPhone),
    sharedFields,
    shareChannel: validateEnum(errors, "shareChannel", payload.shareChannel || "WhatsApp", {
      label: "Share channel",
      values: ["WhatsApp"],
    }),
    whatsappMessage: validateRequiredText(errors, "whatsappMessage", payload.whatsappMessage, {
      label: "WhatsApp message",
      min: 10,
      max: 4000,
    }),
    status: validateEnum(errors, "status", payload.status || "shared", {
      label: "Status",
      values: shareStatuses,
    }),
    followUpDate: validateDate(errors, "followUpDate", payload.followUpDate, { label: "Follow-up date" }),
    notes: validateOptionalText(errors, "notes", payload.notes, { label: "Notes", max: 1000 }) || undefined,
  };

  throwIfValidationFailed(errors);
  return sanitized;
};

export const validateShareRecordStatusInput = (payload) => {
  const errors = {};

  const sanitized = {
    status: validateEnum(errors, "status", payload.status, {
      label: "Status",
      values: shareStatuses,
    }),
    followUpDate: validateDate(errors, "followUpDate", payload.followUpDate, { label: "Follow-up date" }),
  };

  throwIfValidationFailed(errors);
  return sanitized;
};

export const validateShareRecordNotesInput = (payload) => {
  const errors = {};

  const sanitized = {
    notes: validateOptionalText(errors, "notes", payload.notes, { label: "Notes", max: 1000 }) || "",
    followUpDate: validateDate(errors, "followUpDate", payload.followUpDate, { label: "Follow-up date" }),
  };

  throwIfValidationFailed(errors);
  return sanitized;
};
