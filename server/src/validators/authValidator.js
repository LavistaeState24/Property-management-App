import { ApiError } from "../utils/ApiError.js";

export const validateRegisterInput = (payload) => {
  if (!payload.name || !payload.email || !payload.password) {
    throw new ApiError(400, "Name, email and password are required");
  }
};

export const validateLoginInput = (payload) => {
  if (!payload.email || !payload.password) {
    throw new ApiError(400, "Email and password are required");
  }
};

