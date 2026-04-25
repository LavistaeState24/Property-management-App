import { createFollowup, listFollowups } from "../services/followupService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createFollowupHandler = asyncHandler(async (req, res) => {
  const followup = await createFollowup(req.body, req.user._id);
  res.status(201).json({ success: true, data: followup });
});

export const listFollowupsHandler = asyncHandler(async (req, res) => {
  const followups = await listFollowups(req.query);
  res.json({ success: true, data: followups });
});

