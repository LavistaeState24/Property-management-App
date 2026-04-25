import { listUsers } from "../services/authService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listUsersHandler = asyncHandler(async (_req, res) => {
  const users = await listUsers();
  res.json({ success: true, data: users });
});

