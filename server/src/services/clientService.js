import { Client } from "../models/Client.js";
import { ApiError } from "../utils/ApiError.js";
import { buildPagination } from "../utils/query.js";
import { applyScopedFilter, assertDocumentScope, getModuleScope } from "../utils/accessControl.js";

export const createClient = async (payload, userId) =>
  Client.create({
    ...payload,
    createdBy: userId,
  });

export const getClients = async (query, currentUser) => {
  const filters = {};
  const { page, limit, skip } = buildPagination(query);

  if (query.sourceOfProperty) {
    filters.sourceOfProperty = query.sourceOfProperty;
  }

  if (query.premiseArea) {
    filters.premiseArea = { $regex: query.premiseArea, $options: "i" };
  }

  if (query.propertyType) {
    filters.propertyType = query.propertyType;
  }

  const scopedFilters = applyScopedFilter(filters, getModuleScope(currentUser, "clients"), currentUser, {
    assigned: ["assignedTo", "createdBy"],
    own: ["createdBy"],
  });

  const [items, total] = await Promise.all([
    Client.find(scopedFilters)
      .populate("assignedTo", "name role")
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
    .populate("assignedTo", "name role")
    .populate("createdBy", "name role");

  if (!client) {
    throw new ApiError(404, "Client not found");
  }

  assertDocumentScope(client, getModuleScope(currentUser, "clients"), currentUser, {
    assigned: ["assignedTo", "createdBy"],
    own: ["createdBy"],
  });

  return client;
};

export const updateClient = async (clientId, payload, currentUser) => {
  const client = await Client.findById(clientId);

  if (!client) {
    throw new ApiError(404, "Client not found");
  }

  assertDocumentScope(client, getModuleScope(currentUser, "clients"), currentUser, {
    assigned: ["assignedTo", "createdBy"],
    own: ["createdBy"],
  });

  client.set(payload);
  await client.save();

  return client;
};

export const deleteClient = async (clientId, currentUser) => {
  const client = await Client.findById(clientId);

  if (!client) {
    throw new ApiError(404, "Client not found");
  }

  assertDocumentScope(client, getModuleScope(currentUser, "clients"), currentUser, {
    assigned: ["assignedTo", "createdBy"],
    own: ["createdBy"],
  });

  await client.deleteOne();
};
