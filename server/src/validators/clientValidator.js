import { ApiError } from "../utils/ApiError.js";

export const validateClientInput = (payload) => {
  if (!payload.name || !payload.phone) {
    throw new ApiError(400, "Client name and phone are required");
  }
};

