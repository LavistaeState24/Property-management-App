import {
  createShareRecord,
  getShareRecordsByClientPhone,
  getShareRecordsByProjectId,
  listShareRecords,
  updateShareRecordNotes,
  updateShareRecordStatus,
} from "../services/shareRecordService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createShareRecordHandler = asyncHandler(async (req, res) => {
  const shareRecord = await createShareRecord({
    ...req.body,
    sharedBy: req.user._id,
    sharedByName: req.user.name,
    sharedByPhone: req.user.phone,
  });
  res.status(201).json({ success: true, data: shareRecord });
});

export const listShareRecordsHandler = asyncHandler(async (_req, res) => {
  const records = await listShareRecords();
  res.json({ success: true, data: records });
});

export const getShareRecordsByClientPhoneHandler = asyncHandler(async (req, res) => {
  const records = await getShareRecordsByClientPhone(req.params.clientPhone);
  res.json({ success: true, data: records });
});

export const getShareRecordsByProjectIdHandler = asyncHandler(async (req, res) => {
  const records = await getShareRecordsByProjectId(req.params.projectId);
  res.json({ success: true, data: records });
});

export const updateShareRecordStatusHandler = asyncHandler(async (req, res) => {
  const record = await updateShareRecordStatus(req.params.id, req.body);
  res.json({ success: true, data: record });
});

export const updateShareRecordNotesHandler = asyncHandler(async (req, res) => {
  const record = await updateShareRecordNotes(req.params.id, req.body);
  res.json({ success: true, data: record });
});
