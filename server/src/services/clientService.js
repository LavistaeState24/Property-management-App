import { Client } from "../models/Client.js";
import { ApiError } from "../utils/ApiError.js";
import { buildPagination } from "../utils/query.js";

export const createClient = async (payload, userId) =>
  Client.create({
    ...payload,
    createdBy: userId,
  });

export const getClients = async (query) => {
  const filters = {};
  const { page, limit, skip } = buildPagination(query);

  if (query.status) {
    filters.status = query.status;
  }

  if (query.preferredArea) {
    filters.preferredArea = { $regex: query.preferredArea, $options: "i" };
  }

  if (query.propertyType) {
    filters.propertyType = query.propertyType;
  }

  const [items, total] = await Promise.all([
    Client.find(filters)
      .populate("assignedTo", "name role")
      .populate("createdBy", "name role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Client.countDocuments(filters),
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

export const getClientById = async (clientId) => {
  const client = await Client.findById(clientId)
    .populate("assignedTo", "name role")
    .populate("createdBy", "name role");

  if (!client) {
    throw new ApiError(404, "Client not found");
  }

  return client;
};

export const updateClient = async (clientId, payload) => {
  const client = await Client.findByIdAndUpdate(clientId, payload, {
    new: true,
    runValidators: true,
  });

  if (!client) {
    throw new ApiError(404, "Client not found");
  }

  return client;
};

export const deleteClient = async (clientId) => {
  const client = await Client.findByIdAndDelete(clientId);

  if (!client) {
    throw new ApiError(404, "Client not found");
  }
};

