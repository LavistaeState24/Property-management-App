import { ShareRecord } from "../models/ShareRecord.js";
import { ApiError } from "../utils/ApiError.js";

export const createShareRecord = async (payload) => ShareRecord.create(payload);

export const listShareRecords = async () =>
  ShareRecord.find()
    .populate("projectId", "publicAlias location status")
    .populate("sharedBy", "name phone role")
    .sort({ createdAt: -1 });

export const getShareRecordsByClientPhone = async (clientPhone) =>
  ShareRecord.find({ clientPhone })
    .populate("projectId", "publicAlias location status")
    .populate("sharedBy", "name phone role")
    .sort({ createdAt: -1 });

export const getShareRecordsByProjectId = async (projectId) =>
  ShareRecord.find({ projectId })
    .populate("projectId", "publicAlias location status")
    .populate("sharedBy", "name phone role")
    .sort({ createdAt: -1 });

export const updateShareRecordStatus = async (id, payload) => {
  const shareRecord = await ShareRecord.findByIdAndUpdate(
    id,
    {
      status: payload.status,
      followUpDate: payload.followUpDate ?? null,
    },
    { new: true, runValidators: true }
  )
    .populate("projectId", "publicAlias location status")
    .populate("sharedBy", "name phone role");

  if (!shareRecord) {
    throw new ApiError(404, "Share record not found");
  }

  return shareRecord;
};

export const updateShareRecordNotes = async (id, payload) => {
  const shareRecord = await ShareRecord.findByIdAndUpdate(
    id,
    {
      notes: payload.notes,
      followUpDate: payload.followUpDate ?? null,
    },
    { new: true, runValidators: true }
  )
    .populate("projectId", "publicAlias location status")
    .populate("sharedBy", "name phone role");

  if (!shareRecord) {
    throw new ApiError(404, "Share record not found");
  }

  return shareRecord;
};

export const deleteShareRecord = async (id) => {
  const shareRecord = await ShareRecord.findByIdAndDelete(id);

  if (!shareRecord) {
    throw new ApiError(404, "Share record not found");
  }

  return shareRecord;
};
