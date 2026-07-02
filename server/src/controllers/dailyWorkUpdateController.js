import {
  createDailyWorkUpdate,
  deleteDailyWorkUpdate,
  getCurrentDailyWorkUpdate,
  getDailyWorkUpdateById,
  listDailyWorkUpdates,
  updateDailyWorkUpdate,
} from "../services/dailyWorkUpdateService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  validateDailyWorkUpdateCreateInput,
  validateDailyWorkUpdateListQuery,
  validateDailyWorkUpdateUpdateInput,
} from "../validators/dailyWorkUpdateValidator.js";

export const createDailyWorkUpdateHandler = asyncHandler(async (req, res) => {
  const payload = validateDailyWorkUpdateCreateInput(req.body);
  const dailyWorkUpdate = await createDailyWorkUpdate(payload, req.user);
  res.status(201).json({ success: true, data: dailyWorkUpdate });
});

export const listDailyWorkUpdatesHandler = asyncHandler(async (req, res) => {
  const query = validateDailyWorkUpdateListQuery(req.query);
  const dailyWorkUpdates = await listDailyWorkUpdates(query, req.user);
  res.json({ success: true, data: dailyWorkUpdates });
});

export const getCurrentDailyWorkUpdateHandler = asyncHandler(async (req, res) => {
  const query = validateDailyWorkUpdateListQuery({ reportDate: req.query.reportDate });
  const dailyWorkUpdate = await getCurrentDailyWorkUpdate(req.user, query.reportDate);
  res.json({ success: true, data: dailyWorkUpdate || null });
});

export const getDailyWorkUpdateHandler = asyncHandler(async (req, res) => {
  const dailyWorkUpdate = await getDailyWorkUpdateById(req.params.id, req.user);
  res.json({ success: true, data: dailyWorkUpdate });
});

export const updateDailyWorkUpdateHandler = asyncHandler(async (req, res) => {
  const payload = validateDailyWorkUpdateUpdateInput(req.body);
  const dailyWorkUpdate = await updateDailyWorkUpdate(req.params.id, payload, req.user);
  res.json({ success: true, data: dailyWorkUpdate });
});

export const deleteDailyWorkUpdateHandler = asyncHandler(async (req, res) => {
  await deleteDailyWorkUpdate(req.params.id, req.user);
  res.json({ success: true, message: "Daily work update deleted successfully" });
});
