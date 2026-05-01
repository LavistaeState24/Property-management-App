import { Followup } from "../models/Followup.js";
import { ShareRecord } from "../models/ShareRecord.js";

export const createFollowup = async (payload, userId) =>
  Followup.create({
    ...payload,
    createdBy: userId,
  });

export const listFollowups = async (query = {}) => {
  const followupFilters = {};
  const shareRecordFilters = {
    followUpDate: { $ne: null },
  };

  if (query.today === "true") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    followupFilters.dueDate = { $gte: start, $lte: end };
    shareRecordFilters.followUpDate = { $gte: start, $lte: end };
  }

  if (query.completed) {
    followupFilters.completed = query.completed === "true";

    if (query.completed === "true") {
      shareRecordFilters.status = "closed";
    } else {
      shareRecordFilters.status = { $ne: "closed" };
    }
  }

  const [followups, shareRecords] = await Promise.all([
    Followup.find(followupFilters)
      .populate("client", "name phone preferredArea")
      .populate("project", "projectName publicAlias")
      .populate("createdBy", "name role")
      .lean(),
    ShareRecord.find(shareRecordFilters)
      .populate("projectId", "projectName publicAlias")
      .populate("sharedBy", "name role")
      .lean(),
  ]);

  const mappedShareRecords = shareRecords.map((record) => ({
    _id: `share-record-${record._id}`,
    sourceId: record._id,
    sourceType: "share-record",
    client: {
      name: record.clientName,
      phone: record.clientPhone,
    },
    project: record.projectId
      ? {
          _id: record.projectId._id,
          projectName: record.projectId.projectName,
          publicAlias: record.projectId.publicAlias || record.projectPublicAlias,
        }
      : {
          publicAlias: record.projectPublicAlias,
        },
    note: record.notes || `Shared record follow-up for ${record.projectPublicAlias}`,
    dueDate: record.followUpDate,
    type: "whatsapp",
    completed: record.status === "closed",
    createdBy: record.sharedBy || {
      name: record.sharedByName,
    },
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    status: record.status,
  }));

  return [...followups, ...mappedShareRecords].sort(
    (left, right) => new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime()
  );
};
