import { Followup } from "../models/Followup.js";

export const createFollowup = async (payload, userId) =>
  Followup.create({
    ...payload,
    createdBy: userId,
  });

export const listFollowups = async (query = {}) => {
  const filters = {};

  if (query.today === "true") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    filters.dueDate = { $gte: start, $lte: end };
  }

  if (query.completed) {
    filters.completed = query.completed === "true";
  }

  return Followup.find(filters)
    .populate("client", "name phone preferredArea")
    .populate("project", "projectName publicAlias")
    .populate("createdBy", "name role")
    .sort({ dueDate: 1 });
};

