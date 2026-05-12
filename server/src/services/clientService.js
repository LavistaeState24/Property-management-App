import { Client } from "../models/Client.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { buildPagination } from "../utils/query.js";

const toObjectId = (value) => value?._id || value || null;

const buildClientVisibilityFilter = async (currentUser) => {
  if (["super-admin", "admin"].includes(currentUser.role)) {
    return {};
  }

  if (currentUser.role === "manager") {
    const teamMembers = await User.find({
      isActive: true,
      $or: [{ _id: currentUser._id }, { role: "sales", managerId: currentUser._id }],
    }).select("_id");
    const teamUserIds = teamMembers.map((user) => user._id);

    return {
      $or: [{ assignedStaff: { $in: teamUserIds } }, { createdBy: { $in: teamUserIds } }],
    };
  }

  return {
    assignedStaff: currentUser._id,
  };
};

const assertClientAccess = async (client, currentUser) => {
  if (["super-admin", "admin"].includes(currentUser.role)) {
    return;
  }

  if (currentUser.role === "manager") {
    const relatedUserIds = [toObjectId(client.assignedStaff), toObjectId(client.createdBy)].filter(Boolean);
    const managedSalesCount = await User.countDocuments({
      role: "sales",
      managerId: currentUser._id,
      _id: { $in: relatedUserIds },
    });

    const hasAccess =
      String(client.assignedStaff || "") === String(currentUser._id) ||
      String(client.createdBy || "") === String(currentUser._id) ||
      managedSalesCount > 0;

    if (hasAccess) {
      return;
    }
  } else if (String(client.assignedStaff || "") === String(currentUser._id)) {
    return;
  }

  throw new ApiError(403, "You do not have access to this resource");
};

export const createClient = async (payload, currentUser) =>
  Client.create({
    ...payload,
    assignedStaff: payload.assignedStaff || currentUser._id,
    createdBy: currentUser._id,
  });

export const getClients = async (query, currentUser) => {
  const filters = {};
  const { page, limit, skip } = buildPagination(query);

  if (query.search) {
    filters.$or = [
      { ownerName: { $regex: query.search, $options: "i" } },
      { clientPhoneNumber: { $regex: query.search, $options: "i" } },
      { premiseName: { $regex: query.search, $options: "i" } },
      { premiseArea: { $regex: query.search, $options: "i" } },
      { areaPreference: { $regex: query.search, $options: "i" } },
    ];
  }

  if (query.sourceOfProperty) {
    filters.sourceOfProperty = query.sourceOfProperty;
  }

  if (query.premiseArea) {
    filters.premiseArea = { $regex: query.premiseArea, $options: "i" };
  }

  if (query.propertyType) {
    filters.propertyType = query.propertyType;
  }

  if (query.leadStatus) {
    filters.leadStatus = query.leadStatus;
  }

  if (query.interestLevel) {
    filters.interestLevel = query.interestLevel;
  }

  if (query.assignedStaff) {
    filters.assignedStaff = query.assignedStaff;
  }

  if (query.source) {
    filters.source = { $regex: query.source, $options: "i" };
  }

  if (query.purpose) {
    filters.purpose = { $regex: query.purpose, $options: "i" };
  }

  if (query.requirementType) {
    filters.requirementType = { $regex: query.requirementType, $options: "i" };
  }

  const visibilityFilter = await buildClientVisibilityFilter(currentUser);
  const scopedFilters =
    Object.keys(filters).length && Object.keys(visibilityFilter).length
      ? { $and: [filters, visibilityFilter] }
      : Object.keys(filters).length
        ? filters
        : visibilityFilter;

  const [items, total] = await Promise.all([
    Client.find(scopedFilters)
      .populate("assignedStaff", "name role managerId")
      .populate("createdBy", "name role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Client.countDocuments(scopedFilters),
  ]);

  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getClientById = async (clientId, currentUser) => {
  const client = await Client.findById(clientId)
    .populate("assignedStaff", "name role managerId")
    .populate("createdBy", "name role");

  if (!client) {
    throw new ApiError(404, "Client not found");
  }

  await assertClientAccess(client, currentUser);

  return client;
};

export const updateClient = async (clientId, payload, currentUser) => {
  const client = await Client.findById(clientId);

  if (!client) {
    throw new ApiError(404, "Client not found");
  }

  await assertClientAccess(client, currentUser);

  client.set(payload);
  await client.save();

  return Client.findById(client._id).populate("assignedStaff", "name role managerId").populate("createdBy", "name role");
};

export const deleteClient = async (clientId, currentUser) => {
  const client = await Client.findById(clientId);

  if (!client) {
    throw new ApiError(404, "Client not found");
  }

  await assertClientAccess(client, currentUser);

  await client.deleteOne();
};
