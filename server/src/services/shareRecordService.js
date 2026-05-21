import { Project } from "../models/Project.js";
import { ShareRecord } from "../models/ShareRecord.js";
import { ApiError } from "../utils/ApiError.js";
import { applyScopedFilter, assertDocumentScope, getModuleScope } from "../utils/accessControl.js";
import { recordShareActivity } from "./activityLogService.js";

export const createShareRecord = async (payload, currentUser) => {
  const project = await Project.findById(payload.projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  assertDocumentScope(project, getModuleScope(currentUser, "projects"), currentUser, {
    assigned: ["createdBy"],
    own: ["createdBy"],
  });

  const shareRecord = await ShareRecord.create({
    ...payload,
    sharedBy: currentUser._id,
    sharedByName: currentUser.name,
    sharedByPhone: currentUser.phone,
  });

  if (shareRecord.client) {
    await recordShareActivity({
      lead: shareRecord.client,
      shareRecord,
      performedBy: currentUser._id,
      metadata: {
        source: "share-record",
      },
    });
  }

  return shareRecord;
};

export const listShareRecords = async (currentUser) =>
  ShareRecord.find(
    applyScopedFilter({}, getModuleScope(currentUser, "shareRecords"), currentUser, {
      assigned: ["sharedBy"],
      own: ["sharedBy"],
    })
  )
    .populate("projectId", "publicAlias location status")
    .populate("sharedBy", "name phone role")
    .sort({ createdAt: -1 });

export const getShareRecordsByClientPhone = async (clientPhone, currentUser) =>
  ShareRecord.find(
    applyScopedFilter({ clientPhone }, getModuleScope(currentUser, "shareRecords"), currentUser, {
      assigned: ["sharedBy"],
      own: ["sharedBy"],
    })
  )
    .populate("projectId", "publicAlias location status")
    .populate("sharedBy", "name phone role")
    .sort({ createdAt: -1 });

export const getShareRecordsByProjectId = async (projectId, currentUser) =>
  ShareRecord.find(
    applyScopedFilter({ projectId }, getModuleScope(currentUser, "shareRecords"), currentUser, {
      assigned: ["sharedBy"],
      own: ["sharedBy"],
    })
  )
    .populate("projectId", "publicAlias location status")
    .populate("sharedBy", "name phone role")
    .sort({ createdAt: -1 });

export const updateShareRecordStatus = async (id, payload, currentUser) => {
  const shareRecord = await ShareRecord.findById(id);

  if (!shareRecord) {
    throw new ApiError(404, "Share record not found");
  }

  assertDocumentScope(shareRecord, getModuleScope(currentUser, "shareRecords"), currentUser, {
    assigned: ["sharedBy"],
    own: ["sharedBy"],
  });

  const previousShareRecord = shareRecord.toObject();
  shareRecord.status = payload.status;
  shareRecord.followUpDate = payload.followUpDate ?? null;
  await shareRecord.save();
  await shareRecord.populate("projectId", "publicAlias location status");
  await shareRecord.populate("sharedBy", "name phone role");

  if (shareRecord.client) {
    await recordShareActivity({
      lead: shareRecord.client,
      shareRecord,
      performedBy: currentUser._id,
      metadata: {
        source: "share-record-status",
        previousStatus: previousShareRecord.status,
      },
    });
  }

  return shareRecord;
};

export const updateShareRecordNotes = async (id, payload, currentUser) => {
  const shareRecord = await ShareRecord.findById(id);

  if (!shareRecord) {
    throw new ApiError(404, "Share record not found");
  }

  assertDocumentScope(shareRecord, getModuleScope(currentUser, "shareRecords"), currentUser, {
    assigned: ["sharedBy"],
    own: ["sharedBy"],
  });

  const previousShareRecord = shareRecord.toObject();
  shareRecord.notes = payload.notes;
  shareRecord.followUpDate = payload.followUpDate ?? null;
  await shareRecord.save();
  await shareRecord.populate("projectId", "publicAlias location status");
  await shareRecord.populate("sharedBy", "name phone role");

  if (shareRecord.client) {
    await recordShareActivity({
      lead: shareRecord.client,
      shareRecord,
      performedBy: currentUser._id,
      metadata: {
        source: "share-record-notes",
        previousNotes: previousShareRecord.notes,
      },
    });
  }

  return shareRecord;
};

export const deleteShareRecord = async (id, currentUser) => {
  const shareRecord = await ShareRecord.findById(id);

  if (!shareRecord) {
    throw new ApiError(404, "Share record not found");
  }

  assertDocumentScope(shareRecord, getModuleScope(currentUser, "shareRecords"), currentUser, {
    assigned: ["sharedBy"],
    own: ["sharedBy"],
  });

  await shareRecord.deleteOne();

  return shareRecord;
};
