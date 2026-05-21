import { CallLog } from "../models/CallLog.js";
import { Client } from "../models/Client.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { recordCallActivity, recordLeadChangeActivities } from "./activityLogService.js";
import { createFollowupFromCallLog, hasOverduePendingFollowup } from "./followupService.js";

const toObjectId = (value) => value?._id || value || null;
const toObjectIdString = (value) => String(toObjectId(value) || "");

const getAssignedUserId = (client) => toObjectId(client.assignedStaff) || toObjectId(client.assignedTo) || null;

const assertClientAccess = async (client, currentUser) => {
  if (["super-admin", "admin"].includes(currentUser.role)) {
    return;
  }

  if (currentUser.role === "manager") {
    const relatedUserIds = [getAssignedUserId(client), toObjectId(client.createdBy)].filter(Boolean);
    const managedSalesCount = await User.countDocuments({
      role: "sales",
      managerId: currentUser._id,
      _id: { $in: relatedUserIds },
    });

    const hasAccess =
      toObjectIdString(getAssignedUserId(client)) === toObjectIdString(currentUser._id) ||
      toObjectIdString(client.createdBy) === toObjectIdString(currentUser._id) ||
      managedSalesCount > 0;

    if (hasAccess) {
      return;
    }
  } else if (toObjectIdString(getAssignedUserId(client)) === toObjectIdString(currentUser._id)) {
    return;
  }

  throw new ApiError(403, "You do not have access to this resource");
};

const getAccessibleClient = async (clientId, currentUser) => {
  const client = await Client.findById(clientId);

  if (!client) {
    throw new ApiError(404, "Client not found");
  }

  await assertClientAccess(client, currentUser);
  return client;
};

const populateCallLogUsers = (query) => query.populate("createdBy", "name role");

export const listCallLogs = async (clientId, currentUser) => {
  await getAccessibleClient(clientId, currentUser);

  return populateCallLogUsers(CallLog.find({ client: clientId }).sort({ createdAt: -1 }));
};

export const createCallLog = async (clientId, payload, currentUser) => {
  const client = await getAccessibleClient(clientId, currentUser);
  const previousClient = client.toObject();

  if (!["super-admin", "admin"].includes(currentUser.role) && (await hasOverduePendingFollowup(client._id))) {
    throw new ApiError(409, "Overdue pending reminder must be completed before saving a new call update", null, {
      reminder: "Complete or cancel overdue pending reminders before saving a new call update",
    });
  }

  const callLog = await CallLog.create({
    ...payload,
    client: client._id,
    createdBy: currentUser._id,
  });

  const clientUpdates = {
    leadStatus: payload.leadStatus,
    lastCallStatus: payload.discussionSummary,
    nextFollowUpDate: payload.nextFollowupDateTime,
  };

  if (payload.interestLevel) {
    clientUpdates.interestLevel = payload.interestLevel;
  }

  if (payload.requirementNote) {
    clientUpdates.notes = [client.notes, payload.requirementNote].filter(Boolean).join("\n\n");
  }

  client.set(clientUpdates);
  await client.save();

  await createFollowupFromCallLog({
    client: client._id,
    assignedStaff: getAssignedUserId(client) || currentUser._id,
    reminderType: payload.reminderType,
    reminderDateTime: payload.nextFollowupDateTime,
    note: payload.nextAction || payload.discussionSummary,
    createdBy: currentUser._id,
  });

  const refreshedClient = await Client.findById(client._id);

  await Promise.all([
    recordCallActivity({
      lead: refreshedClient,
      callLog,
      performedBy: currentUser._id,
      metadata: {
        callConnected: Boolean(payload.callConnected),
        reminderType: payload.reminderType,
      },
    }),
    recordLeadChangeActivities({
      lead: refreshedClient,
      before: previousClient,
      after: refreshedClient,
      performedBy: currentUser._id,
      metadata: {
        source: "call-log",
      },
    }),
  ]);

  return populateCallLogUsers(CallLog.findById(callLog._id));
};
