import {
  throwIfValidationFailed,
  validateDate,
  validateEnum,
  validateNumber,
  validateRequiredText,
} from "./common.js";

const sourceOfPropertyValues = ["Owner", "Broker"];
const propertyTypes = ["1BHK", "2BHK", "3BHK", "4BHK", "Penthouse", "Raw House", "Tenament", "Bungalow"];
const propertyConditionValues = ["Unfurnished", "Semi Furnished", "Furnished", "Fully Furnished"];

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
    dateOfAddingProperty: validateDate(errors, "dateOfAddingProperty", payload.dateOfAddingProperty, { label: "Date of adding property", required: true }),
  };

  throwIfValidationFailed(errors);
  return sanitized;
};
