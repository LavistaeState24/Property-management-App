import {
  throwIfValidationFailed,
  validateDate,
  validateEmail,
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
const salesAllowedUpdateFields = [
  "leadStatus",
  "interestLevel",
  "notes",
  "internalNotes",
  "lastCallStatus",
  "nextFollowUpDate",
];

const hasOwnProperty = (payload, field) => Object.prototype.hasOwnProperty.call(payload, field);

const validateNullableDate = (errors, field, value, { label }) => {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  return validateDate(errors, field, value, { label, required: false });
};

export const validateClientInput = (payload, options = {}) => {
  const { partial = false, allowedFields = null } = options;
  const errors = {};
  const fields = allowedFields || [
    "ownerName",
    "address",
    "premiseName",
    "premiseArea",
    "sourceOfProperty",
    "propertyType",
    "ownerPrice",
    "propertyCondition",
    "propertyAge",
    "propertySize",
    "clientPhoneNumber",
    "email",
    "internalNotes",
    "propertyStatus",
    "dateOfAddingProperty",
    "assignedStaff",
    "leadStatus",
    "interestLevel",
    "source",
    "purpose",
    "budgetMin",
    "budgetMax",
    "requirementType",
    "areaPreference",
    "notes",
    "lastCallStatus",
    "nextFollowUpDate",
  ];
  const shouldValidateField = (field) => fields.includes(field) && (!partial || hasOwnProperty(payload, field));

  const sanitized = {
    ...(shouldValidateField("ownerName")
      ? { ownerName: validateRequiredText(errors, "ownerName", payload.ownerName, { label: "Owner name", min: 3, max: 80 }) }
      : {}),
    ...(shouldValidateField("address")
      ? { address: validateRequiredText(errors, "address", payload.address, { label: "Address", min: 5, max: 200 }) }
      : {}),
    ...(shouldValidateField("premiseName")
      ? { premiseName: validateRequiredText(errors, "premiseName", payload.premiseName, { label: "Premise name", min: 2, max: 100 }) }
      : {}),
    ...(shouldValidateField("premiseArea")
      ? { premiseArea: validateRequiredText(errors, "premiseArea", payload.premiseArea, { label: "Premise area", min: 2, max: 80 }) }
      : {}),
    ...(shouldValidateField("sourceOfProperty")
      ? { sourceOfProperty: validateEnum(errors, "sourceOfProperty", payload.sourceOfProperty, {
      label: "Source of property",
      values: sourceOfPropertyValues,
    }) }
      : {}),
    ...(shouldValidateField("propertyType")
      ? { propertyType: validateEnum(errors, "propertyType", payload.propertyType, { label: "Property type", values: propertyTypes }) }
      : {}),
    ...(shouldValidateField("ownerPrice")
      ? { ownerPrice: validateNumber(errors, "ownerPrice", payload.ownerPrice, { label: "Owner price", required: true, min: 0 }) }
      : {}),
    ...(shouldValidateField("propertyCondition")
      ? { propertyCondition: validateEnum(errors, "propertyCondition", payload.propertyCondition, {
      label: "Property condition",
      values: propertyConditionValues,
    }) }
      : {}),
    ...(shouldValidateField("propertyAge")
      ? { propertyAge: validateRequiredText(errors, "propertyAge", payload.propertyAge, { label: "Property age", min: 1, max: 80 }) }
      : {}),
    ...(shouldValidateField("propertySize")
      ? { propertySize: validateRequiredText(errors, "propertySize", payload.propertySize, { label: "Size of property", min: 1, max: 80 }) }
      : {}),
    ...(shouldValidateField("clientPhoneNumber")
      ? { clientPhoneNumber: validatePhone(errors, "clientPhoneNumber", payload.clientPhoneNumber, {
      requiredMessage: "Client phone number is required",
      invalidMessage: "Client phone number must be a valid 10-digit Indian mobile number",
    }) }
      : {}),
    ...(shouldValidateField("email")
      ? { email: validateEmail(errors, "email", payload.email, { required: false }) }
      : {}),
    ...(shouldValidateField("internalNotes")
      ? { internalNotes: validateOptionalText(errors, "internalNotes", payload.internalNotes, { label: "Internal notes", max: 500 }) }
      : {}),
    ...(shouldValidateField("propertyStatus")
      ? { propertyStatus: validateEnum(errors, "propertyStatus", payload.propertyStatus, {
      label: "Property status",
      values: propertyStatusValues,
    }) }
      : {}),
    ...(shouldValidateField("dateOfAddingProperty")
      ? {
          dateOfAddingProperty: validateDate(errors, "dateOfAddingProperty", payload.dateOfAddingProperty, {
            label: "Date of adding property",
            required: true,
          }),
        }
      : {}),
    ...(shouldValidateField("assignedStaff")
      ? { assignedStaff: validateObjectId(errors, "assignedStaff", payload.assignedStaff, { label: "Assigned staff", required: false }) || null }
      : {}),
    ...(shouldValidateField("leadStatus")
      ? { leadStatus: validateEnum(errors, "leadStatus", payload.leadStatus, { label: "Lead status", values: leadStatusValues }) }
      : {}),
    ...(shouldValidateField("interestLevel")
      ? { interestLevel: validateEnum(errors, "interestLevel", payload.interestLevel, {
      label: "Interest level",
      values: interestLevelValues,
    }) }
      : {}),
    ...(shouldValidateField("source")
      ? { source: validateOptionalText(errors, "source", payload.source, { label: "Lead source", max: 100 }) }
      : {}),
    ...(shouldValidateField("purpose")
      ? { purpose: validateOptionalText(errors, "purpose", payload.purpose, { label: "Purpose", max: 80 }) }
      : {}),
    ...(shouldValidateField("budgetMin")
      ? { budgetMin: validateNumber(errors, "budgetMin", payload.budgetMin, { label: "Minimum budget", required: false, min: 0 }) }
      : {}),
    ...(shouldValidateField("budgetMax")
      ? { budgetMax: validateNumber(errors, "budgetMax", payload.budgetMax, { label: "Maximum budget", required: false, min: 0 }) }
      : {}),
    ...(shouldValidateField("requirementType")
      ? { requirementType: validateOptionalText(errors, "requirementType", payload.requirementType, { label: "Requirement type", max: 80 }) }
      : {}),
    ...(shouldValidateField("areaPreference")
      ? { areaPreference: validateOptionalText(errors, "areaPreference", payload.areaPreference, { label: "Area preference", max: 120 }) }
      : {}),
    ...(shouldValidateField("notes")
      ? { notes: validateOptionalText(errors, "notes", payload.notes, { label: "Notes", max: 2000 }) }
      : {}),
    ...(shouldValidateField("lastCallStatus")
      ? { lastCallStatus: validateOptionalText(errors, "lastCallStatus", payload.lastCallStatus, { label: "Last call status", max: 120 }) }
      : {}),
    ...(shouldValidateField("nextFollowUpDate")
      ? { nextFollowUpDate: validateNullableDate(errors, "nextFollowUpDate", payload.nextFollowUpDate, { label: "Next follow-up date" }) }
      : {}),
  };

  if (sanitized.budgetMin !== undefined && sanitized.budgetMax !== undefined && sanitized.budgetMax < sanitized.budgetMin) {
    errors.budgetMax = "Maximum budget must be at least minimum budget";
  }

  throwIfValidationFailed(errors);
  return sanitized;
};

export const validateClientUpdateInput = (payload, currentUser) => {
  if (currentUser.role === "sales") {
    const invalidFields = Object.keys(payload).filter((field) => !salesAllowedUpdateFields.includes(field));

    if (invalidFields.length) {
      throwIfValidationFailed({
        [invalidFields[0]]: "Sales users can only update pipeline follow-up fields",
      });
    }

    return validateClientInput(payload, {
      partial: true,
      allowedFields: salesAllowedUpdateFields,
    });
  }

  return validateClientInput(payload, { partial: true });
};
