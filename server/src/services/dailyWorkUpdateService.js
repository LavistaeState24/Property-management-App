import { DailyWorkUpdate } from "../models/DailyWorkUpdate.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { applyScopedFilter, assertDocumentScope, getModuleScope } from "../utils/accessControl.js";
import { buildPagination } from "../utils/query.js";

const toObjectId = (value) => value?._id || value || null;
const toObjectIdString = (value) => String(toObjectId(value) || "");

const editableReportFields = ["achievements", "pendingWork", "tomorrowPlan", "blockers", "additionalNotes"];

export const normalizeReportDateValue = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, "Report date must be a valid date");
  }

  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
};

const populateDailyWorkUpdate = (query) =>
  query
    .populate("userId", "name email role phone managerId")
    .populate("managerId", "name role phone")
    .populate("reviewedBy", "name role phone");

const assertDailyWorkUpdateScope = (dailyWorkUpdate, currentUser) =>
  assertDocumentScope(dailyWorkUpdate, getModuleScope(currentUser, "dailyWorkUpdates"), currentUser, {
    assigned: ["managerId"],
    team: ["managerId"],
    own: ["userId"],
  });

const getReportOwner = async (payloadUserId, currentUser) => {
  const targetUserId = payloadUserId || currentUser._id;

  if (currentUser.role !== "super-admin" && toObjectIdString(targetUserId) !== toObjectIdString(currentUser._id)) {
    throw new ApiError(403, "You can create a report only for yourself");
  }

  const user = await User.findOne({ _id: targetUserId, isActive: true }).select("_id name role managerId");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;
};

const assignEditableFields = (dailyWorkUpdate, payload) => {
  editableReportFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      dailyWorkUpdate[field] = payload[field];
    }
  });
};

const clearReviewState = (dailyWorkUpdate) => {
  dailyWorkUpdate.reviewedAt = null;
  dailyWorkUpdate.reviewedBy = null;
};

const setDraftStatus = (dailyWorkUpdate) => {
  dailyWorkUpdate.status = "Draft";
  dailyWorkUpdate.submittedAt = null;
  clearReviewState(dailyWorkUpdate);
};

const setSubmittedStatus = (dailyWorkUpdate) => {
  dailyWorkUpdate.status = "Submitted";
  dailyWorkUpdate.submittedAt = new Date();
  clearReviewState(dailyWorkUpdate);
};

const setReviewedStatus = (dailyWorkUpdate, reviewerId) => {
  if (!dailyWorkUpdate.submittedAt) {
    dailyWorkUpdate.submittedAt = new Date();
  }

  dailyWorkUpdate.status = "Reviewed";
  dailyWorkUpdate.reviewedAt = new Date();
  dailyWorkUpdate.reviewedBy = reviewerId;
};

export const createDailyWorkUpdate = async (payload, currentUser) => {
  const reportOwner = await getReportOwner(payload.userId, currentUser);
  const reportDate = normalizeReportDateValue(payload.reportDate || new Date());
  const existingDailyWorkUpdate = await DailyWorkUpdate.findOne({
    userId: reportOwner._id,
    reportDate,
  }).select("_id");

  if (existingDailyWorkUpdate) {
    throw new ApiError(409, "A daily work update already exists for this user on this date");
  }

  try {
    const dailyWorkUpdate = await DailyWorkUpdate.create({
      userId: reportOwner._id,
      managerId: reportOwner.managerId || null,
      reportDate,
      achievements: payload.achievements,
      pendingWork: payload.pendingWork,
      tomorrowPlan: payload.tomorrowPlan,
      blockers: payload.blockers || "",
      additionalNotes: payload.additionalNotes || "",
      status: payload.status || "Draft",
      submittedAt: payload.status === "Submitted" ? new Date() : null,
    });

    return populateDailyWorkUpdate(DailyWorkUpdate.findById(dailyWorkUpdate._id));
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError(409, "Duplicate daily work update submission is not allowed");
    }

    throw error;
  }
};

export const listDailyWorkUpdates = async (query = {}, currentUser) => {
  const { page, limit, skip } = buildPagination(query);
  const filters = {};

  if (query.userId) {
    filters.userId = query.userId;
  }

  if (query.status) {
    filters.status = query.status;
  }

  if (query.reportDate) {
    filters.reportDate = normalizeReportDateValue(query.reportDate);
  } else if (query.dateFrom || query.dateTo) {
    filters.reportDate = {};

    if (query.dateFrom) {
      filters.reportDate.$gte = normalizeReportDateValue(query.dateFrom);
    }

    if (query.dateTo) {
      filters.reportDate.$lte = normalizeReportDateValue(query.dateTo);
    }
  }

  const scope = getModuleScope(currentUser, "dailyWorkUpdates");

  let scopedFilters;

  if (scope === "team" && currentUser.role === "manager") {
    const teamUsers = await User.find({
      role: "sales",
      managerId: currentUser._id,
      isActive: true,
    }).select("_id");

    scopedFilters = {
      ...filters,
      userId: { $in: teamUsers.map((user) => user._id) },
    };
  } else {
    scopedFilters = applyScopedFilter(filters, scope, currentUser, {
      assigned: ["managerId"],
      team: ["managerId"],
      own: ["userId"],
    });
  }

  const [items, total] = await Promise.all([
    populateDailyWorkUpdate(DailyWorkUpdate.find(scopedFilters))
      .sort({ reportDate: -1, updatedAt: -1 })
      .skip(skip)
      .limit(limit),
    DailyWorkUpdate.countDocuments(scopedFilters),
  ]);

  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getCurrentDailyWorkUpdate = async (currentUser, reportDateValue) =>
  populateDailyWorkUpdate(
    DailyWorkUpdate.findOne({
      userId: currentUser._id,
      reportDate: normalizeReportDateValue(reportDateValue || new Date()),
    })
  );

export const getDailyWorkUpdateById = async (id, currentUser) => {
  const dailyWorkUpdate = await populateDailyWorkUpdate(DailyWorkUpdate.findById(id));

  if (!dailyWorkUpdate) {
    throw new ApiError(404, "Daily work update not found");
  }

  assertDailyWorkUpdateScope(dailyWorkUpdate, currentUser);
  return dailyWorkUpdate;
};

export const updateDailyWorkUpdate = async (id, payload, currentUser) => {
  const dailyWorkUpdate = await DailyWorkUpdate.findById(id);

  if (!dailyWorkUpdate) {
    throw new ApiError(404, "Daily work update not found");
  }

  assertDailyWorkUpdateScope(dailyWorkUpdate, currentUser);

  const isSuperAdmin = currentUser.role === "super-admin";
  const isOwner = toObjectIdString(dailyWorkUpdate.userId) === toObjectIdString(currentUser._id);
  const isManagerReview = !isOwner && (currentUser.role === "manager" || isSuperAdmin);
  const hasEditableFieldChanges = editableReportFields.some((field) => Object.prototype.hasOwnProperty.call(payload, field));

  if (isOwner && currentUser.role === "sales" && dailyWorkUpdate.status === "Reviewed") {
    throw new ApiError(400, "Reviewed daily work updates cannot be edited");
  }

  if (isManagerReview && !isSuperAdmin && hasEditableFieldChanges) {
    throw new ApiError(403, "Managers cannot edit employee work update content");
  }

  if (Object.prototype.hasOwnProperty.call(payload, "managerComment") && !(isManagerReview || isSuperAdmin)) {
    throw new ApiError(403, "You do not have permission to add a manager comment");
  }

  if (Object.prototype.hasOwnProperty.call(payload, "status")) {
    if (isOwner && !isSuperAdmin && !["Draft", "Submitted"].includes(payload.status)) {
      throw new ApiError(403, "You do not have permission to set this status");
    }

    if (isManagerReview && !isSuperAdmin && payload.status !== "Reviewed") {
      throw new ApiError(403, "Managers can only mark reports as reviewed");
    }
  }

  if (isManagerReview && payload.status === "Reviewed" && dailyWorkUpdate.status === "Draft") {
    throw new ApiError(400, "Draft reports must be submitted before they can be reviewed");
  }

  if (hasEditableFieldChanges) {
    assignEditableFields(dailyWorkUpdate, payload);
  }

  if (Object.prototype.hasOwnProperty.call(payload, "managerComment") && (isManagerReview || isSuperAdmin)) {
    dailyWorkUpdate.managerComment = payload.managerComment;
  }

  if (Object.prototype.hasOwnProperty.call(payload, "status")) {
    if (payload.status === "Draft") {
      setDraftStatus(dailyWorkUpdate);
    } else if (payload.status === "Submitted") {
      setSubmittedStatus(dailyWorkUpdate);
    } else if (payload.status === "Reviewed") {
      setReviewedStatus(dailyWorkUpdate, currentUser._id);
    }
  }

  await dailyWorkUpdate.save();
  return populateDailyWorkUpdate(DailyWorkUpdate.findById(dailyWorkUpdate._id));
};

export const deleteDailyWorkUpdate = async (id, currentUser) => {
  const dailyWorkUpdate = await DailyWorkUpdate.findById(id);

  if (!dailyWorkUpdate) {
    throw new ApiError(404, "Daily work update not found");
  }

  assertDailyWorkUpdateScope(dailyWorkUpdate, currentUser);
  await dailyWorkUpdate.deleteOne();
  return dailyWorkUpdate;
};
