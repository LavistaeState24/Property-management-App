import { ApiError } from "../utils/ApiError.js";

export const validateProjectInput = (payload) => {
  const requiredFields = ["projectName", "publicAlias", "location", "propertyType"];
  const missingField = requiredFields.find((field) => !payload[field]);

  if (missingField) {
    throw new ApiError(400, `${missingField} is required`);
  }
};

