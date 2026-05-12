import { Client } from "../models/Client.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { buildPagination } from "../utils/query.js";

const toObjectId = (value) => value?._id || value || null;
const toObjectIdString = (value) => String(toObjectId(value) || "");

const populateClientUsers = (query) =>
  query
    .populate("assignedStaff", "name role managerId")
    .populate("assignedTo", "name role managerId")
    .populate("createdBy", "name role");

const normalizeAssignedStaff = (client) => {
  if (!client) {
    return client;
  }

  if (!client.assignedStaff && client.assignedTo) {
    client.assignedStaff = client.assignedTo;
  }

  return client;
};

const normalizeClients = (clients) => clients.map((client) => normalizeAssignedStaff(client));

const getAssignedUserId = (client) => toObjectId(client.assignedStaff) || toObjectId(client.assignedTo) || null;

const assertValidAssignee = async (assignedStaff, currentUser) => {
  if (!assignedStaff) {
    return null;
  }

  if (currentUser.role === "sales") {
    if (toObjectIdString(assignedStaff) === toObjectIdString(currentUser._id)) {
      return currentUser._id;
    }

    throw new ApiError(403, "Sales users cannot reassign leads");
  }

  const user = await User.findOne({ _id: assignedStaff, isActive: true }).select("_id role managerId");

  if (!user || user.role === "super-admin") {
    throw new ApiError(400, "Assigned staff is invalid");
  }

  if (currentUser.role === "manager") {
    const isSelf = toObjectIdString(user._id) === toObjectIdString(currentUser._id);
    const isManagedSales = user.role === "sales" && toObjectIdString(user.managerId) === toObjectIdString(currentUser._id);

    if (!isSelf && !isManagedSales) {
      throw new ApiError(403, "Managers can only assign leads to their own team");
    }
  }

  return user._id;
};

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
      $or: [{ assignedStaff: { $in: teamUserIds } }, { assignedTo: { $in: teamUserIds } }, { createdBy: { $in: teamUserIds } }],
    };
  }

  return {
    $or: [{ assignedStaff: currentUser._id }, { assignedTo: currentUser._id }],
  };
};

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
      String(client.createdBy || "") === String(currentUser._id) ||
      managedSalesCount > 0;

    if (hasAccess) {
      return;
    }
  } else if (toObjectIdString(getAssignedUserId(client)) === toObjectIdString(currentUser._id)) {
    return;
  }

  throw new ApiError(403, "You do not have access to this resource");
};

export const createClient = async (payload, currentUser) =>
  Client.create({
    ...payload,
    assignedStaff: (await assertValidAssignee(payload.assignedStaff || currentUser._id, currentUser)) || currentUser._id,
    createdBy: currentUser._id,
  });

export const getClients = async (query, currentUser) => {
  const filters = {};
  const andFilters = [];
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
    andFilters.push({
      $or: [{ assignedStaff: query.assignedStaff }, { assignedTo: query.assignedStaff }],
    });
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

  const baseFilters = andFilters.length ? { ...filters, $and: andFilters } : filters;
  const visibilityFilter = await buildClientVisibilityFilter(currentUser);
  const scopedFilters =
    Object.keys(baseFilters).length && Object.keys(visibilityFilter).length
      ? { $and: [baseFilters, visibilityFilter] }
      : Object.keys(baseFilters).length
        ? baseFilters
        : visibilityFilter;

  const [items, total] = await Promise.all([
    populateClientUsers(Client.find(scopedFilters))
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Client.countDocuments(scopedFilters),
  ]);

  return {
    items: normalizeClients(items),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getClientById = async (clientId, currentUser) => {
  const client = await populateClientUsers(Client.findById(clientId));

  if (!client) {
    throw new ApiError(404, "Client not found");
  }

  await assertClientAccess(client, currentUser);

  return normalizeAssignedStaff(client);
};

export const updateClient = async (clientId, payload, currentUser) => {
  const client = await Client.findById(clientId);

  if (!client) {
    throw new ApiError(404, "Client not found");
  }

  await assertClientAccess(client, currentUser);

  if (Object.prototype.hasOwnProperty.call(payload, "assignedStaff")) {
    payload.assignedStaff = await assertValidAssignee(payload.assignedStaff, currentUser);
  }

  client.set(payload);
  await client.save();

  return normalizeAssignedStaff(await populateClientUsers(Client.findById(client._id)));
};

export const deleteClient = async (clientId, currentUser) => {
  const client = await Client.findById(clientId);

  if (!client) {
    throw new ApiError(404, "Client not found");
  }

  await assertClientAccess(client, currentUser);

  await client.deleteOne();
};
