import {
  throwIfValidationFailed,
  validateDate,
  validateEnum,
  validateNumber,
  validateObjectId,
  validateOptionalText,
  validatePhone,
  validateRequiredText,
} from "./common.js";

const sourceOfPropertyValues = ["Owner", "Broker"];
const propertyTypes = ["1BHK", "2BHK", "3BHK", "4BHK", "Penthouse", "Raw House", "Tenament", "Bungalow"];
const propertyConditionValues = ["Unfurnished", "Semi Furnished", "Furnished", "Fully Furnished"];
const propertyStatusValues = ["Available", "Hold", "Sold", "Rent Out", "Not Available"];
const leadStatusValues = [
  "New Lead",
  "Call Pending",
  "Connected",
  "Requirement Taken",
  "Details Sent",
  "Follow-up Pending",
  "Positive",
  "Site Visit Planned",
  "Negotiation",
  "Booking",
  "Closed",
  "Lost",
];
const interestLevelValues = ["Hot", "Warm", "Cold"];

export const validateClientInput = (payload) => {
  const errors = {};

  const sanitized = {
    ownerName: validateRequiredText(errors, "ownerName", payload.ownerName, { label: "Owner name", min: 3, max: 80 }),
    address: validateRequiredText(errors, "address", payload.address, { label: "Address", min: 5, max: 200 }),
    premiseName: validateRequiredText(errors, "premiseName", payload.premiseName, { label: "Premise name", min: 2, max: 100 }),
    premiseArea: validateRequiredText(errors, "premiseArea", payload.premiseArea, { label: "Premise area", min: 2, max: 80 }),
    sourceOfProperty: validateEnum(errors, "sourceOfProperty", payload.sourceOfProperty, {
      label: "Source of property",
      values: sourceOfPropertyValues,
    }),
    propertyType: validateEnum(errors, "propertyType", payload.propertyType, { label: "Property type", values: propertyTypes }),
    ownerPrice: validateNumber(errors, "ownerPrice", payload.ownerPrice, { label: "Owner price", required: true, min: 0 }),
    propertyCondition: validateEnum(errors, "propertyCondition", payload.propertyCondition, {
      label: "Property condition",
      values: propertyConditionValues,
    }),
    propertyAge: validateRequiredText(errors, "propertyAge", payload.propertyAge, { label: "Property age", min: 1, max: 80 }),
    propertySize: validateRequiredText(errors, "propertySize", payload.propertySize, { label: "Size of property", min: 1, max: 80 }),
    clientPhoneNumber: validatePhone(errors, "clientPhoneNumber", payload.clientPhoneNumber, {
      requiredMessage: "Client phone number is required",
      invalidMessage: "Client phone number must be a valid 10-digit Indian mobile number",
    }),
    internalNotes: validateOptionalText(errors, "internalNotes", payload.internalNotes, { label: "Internal notes", max: 500 }),
    propertyStatus: validateEnum(errors, "propertyStatus", payload.propertyStatus, {
      label: "Property status",
      values: propertyStatusValues,
    }),
    dateOfAddingProperty: validateDate(errors, "dateOfAddingProperty", payload.dateOfAddingProperty, { label: "Date of adding property", required: true }),
    assignedStaff: validateObjectId(errors, "assignedStaff", payload.assignedStaff, { label: "Assigned staff", required: false }) || null,
    leadStatus: validateEnum(errors, "leadStatus", payload.leadStatus, { label: "Lead status", values: leadStatusValues }),
    interestLevel: validateEnum(errors, "interestLevel", payload.interestLevel, {
      label: "Interest level",
      values: interestLevelValues,
    }),
    source: validateOptionalText(errors, "source", payload.source, { label: "Lead source", max: 100 }),
    purpose: validateOptionalText(errors, "purpose", payload.purpose, { label: "Purpose", max: 80 }),
    budgetMin: validateNumber(errors, "budgetMin", payload.budgetMin, { label: "Minimum budget", required: false, min: 0 }),
    budgetMax: validateNumber(errors, "budgetMax", payload.budgetMax, { label: "Maximum budget", required: false, min: 0 }),
    requirementType: validateOptionalText(errors, "requirementType", payload.requirementType, { label: "Requirement type", max: 80 }),
    areaPreference: validateOptionalText(errors, "areaPreference", payload.areaPreference, { label: "Area preference", max: 120 }),
    notes: validateOptionalText(errors, "notes", payload.notes, { label: "Notes", max: 2000 }),
  };

  if (sanitized.budgetMin !== undefined && sanitized.budgetMax !== undefined && sanitized.budgetMax < sanitized.budgetMin) {
    errors.budgetMax = "Maximum budget must be at least minimum budget";
  }

  throwIfValidationFailed(errors);
  return sanitized;
};
