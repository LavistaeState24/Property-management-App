import {
  throwIfValidationFailed,
  validateDate,
  validateEmail,
  validateEnum,
  validateNumber,
  validateOptionalText,
  validatePhone,
  validateRequiredText,
} from "./common.js";

const propertyTypes = ["1 BHK", "2 BHK", "3 BHK", "4 BHK", "villa", "plot", "office", "showroom"];
const clientStatuses = ["new", "interested", "site visit", "negotiation", "closed", "lost"];

export const validateClientInput = (payload) => {
  const errors = {};

  const sanitized = {
    name: validateRequiredText(errors, "name", payload.name, { label: "Client name", min: 3, max: 60 }),
    phone: validatePhone(errors, "phone", payload.phone),
    email: validateEmail(errors, "email", payload.email, { required: false }) || undefined,
    requirement: validateRequiredText(errors, "requirement", payload.requirement, { label: "Requirement", min: 5, max: 160 }),
    budgetMin: validateNumber(errors, "budgetMin", payload.budgetMin, { label: "Minimum budget", min: 0 }),
    budgetMax: validateNumber(errors, "budgetMax", payload.budgetMax, { label: "Maximum budget", min: 0 }),
    preferredArea: validateRequiredText(errors, "preferredArea", payload.preferredArea, { label: "Preferred area", min: 2, max: 80 }),
    propertyType: validateEnum(errors, "propertyType", payload.propertyType, { label: "Property type", values: propertyTypes }),
    followUpDate: validateDate(errors, "followUpDate", payload.followUpDate, { label: "Client details added" }),
    status: validateEnum(errors, "status", payload.status || "new", { label: "Status", values: clientStatuses }),
    notes: validateOptionalText(errors, "notes", payload.notes, { label: "Notes", max: 500 }) || undefined,
  };

  if (
    sanitized.budgetMin !== undefined &&
    sanitized.budgetMax !== undefined &&
    sanitized.budgetMax < sanitized.budgetMin
  ) {
    errors.budgetMax = "Maximum budget must be greater than or equal to minimum budget";
  }

  throwIfValidationFailed(errors);
  return sanitized;
};
