import { Client } from "../models/Client.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { buildPagination } from "../utils/query.js";
import { EMAIL_REGEX, INDIAN_PHONE_REGEX, normalizeString } from "../validators/common.js";

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

const normalizeImportPhone = (value) => {
  const digits = normalizeString(value).replace(/\D/g, "");

  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }

  return digits;
};

const parseBudgetValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 0 ? value : null;
  }

  const normalized = normalizeString(value).toLowerCase().replace(/,/g, "");
  const multiplier = /\bcr\b|crore/.test(normalized)
    ? 10000000
    : /\d\s*l\b|lac|lakh/.test(normalized)
      ? 100000
      : 1;
  const parsed = Number(normalized.match(/\d+(\.\d+)?/)?.[0]);

  if (Number.isNaN(parsed)) {
    return null;
  }

  return Math.round(parsed * multiplier);
};

const parseBudgetRange = (value) => {
  if (Array.isArray(value)) {
    const numbers = value.map(parseBudgetValue).filter((amount) => amount !== null);
    return {
      budgetMin: numbers[0] ?? null,
      budgetMax: numbers[1] ?? numbers[0] ?? null,
    };
  }

  const normalized = normalizeString(value);
  const parts = normalized.split(/\s*(?:-|to|–|—)\s*/i).filter(Boolean);
  const numbers = (parts.length > 1 ? parts : [value]).map(parseBudgetValue).filter((amount) => amount !== null);

  return {
    budgetMin: numbers.length > 1 ? Math.min(numbers[0], numbers[1]) : null,
    budgetMax: numbers.length > 1 ? Math.max(numbers[0], numbers[1]) : numbers[0] ?? null,
  };
};

const getAssignableUsersForImport = async (currentUser) => {
  if (["super-admin", "admin"].includes(currentUser.role)) {
    return User.find({ role: { $ne: "super-admin" }, isActive: true }).select("_id name email role managerId");
  }

  if (currentUser.role === "manager") {
    return User.find({
      isActive: true,
      $or: [{ _id: currentUser._id }, { role: "sales", managerId: currentUser._id }],
    }).select("_id name email role managerId");
  }

  return [currentUser];
};

const buildAssigneeResolver = async (currentUser) => {
  const users = await getAssignableUsersForImport(currentUser);
  const byId = new Map();
  const byEmail = new Map();
  const byName = new Map();

  users.forEach((user) => {
    byId.set(toObjectIdString(user._id), user._id);
    byEmail.set(normalizeString(user.email).toLowerCase(), user._id);
    byName.set(normalizeString(user.name).toLowerCase(), user._id);
  });

  return (value) => {
    const normalized = normalizeString(value).toLowerCase();

    if (!normalized) {
      return currentUser._id;
    }

    return byId.get(normalized) || byEmail.get(normalized) || byName.get(normalized) || null;
  };
};

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

export const importClients = async (payload, currentUser) => {
  const rows = Array.isArray(payload?.rows) ? payload.rows : [];

  if (!rows.length) {
    throw new ApiError(400, "Import file has no lead rows");
  }

  if (rows.length > 1000) {
    throw new ApiError(400, "Import supports up to 1000 rows at a time");
  }

  const resolveAssignee = await buildAssigneeResolver(currentUser);
  const seenPhones = new Set();
  const candidates = [];
  const invalidRows = [];
  const duplicateRows = [];

  rows.forEach((row, index) => {
    const rowNumber = Number(row.rowNumber || index + 2);
    const ownerName = normalizeString(row.clientName || row.ownerName);
    const clientPhoneNumber = normalizeImportPhone(row.phone || row.clientPhoneNumber);
    const email = normalizeString(row.email).toLowerCase();
    const source = normalizeString(row.source);
    const requirementType = normalizeString(row.requirementType);
    const areaPreference = normalizeString(row.areaPreference);
    const assignedStaff = resolveAssignee(row.assignedStaff);
    const rowErrors = [];

    if (!ownerName || ownerName.length < 3 || ownerName.length > 80) {
      rowErrors.push("Client name must be 3-80 characters");
    }

    if (!INDIAN_PHONE_REGEX.test(clientPhoneNumber)) {
      rowErrors.push("Phone must be a valid 10-digit Indian mobile number");
    }

    if (email && !EMAIL_REGEX.test(email)) {
      rowErrors.push("Email is invalid");
    }

    if (source.length > 100) {
      rowErrors.push("Source must be at most 100 characters");
    }

    if (requirementType.length > 80) {
      rowErrors.push("Requirement type must be at most 80 characters");
    }

    if (areaPreference.length > 120) {
      rowErrors.push("Area preference must be at most 120 characters");
    }

    if (!assignedStaff) {
      rowErrors.push("Assigned staff was not found or is not assignable");
    }

    if (seenPhones.has(clientPhoneNumber)) {
      duplicateRows.push({ rowNumber, phone: clientPhoneNumber, clientName: ownerName, reason: "Duplicate phone in import file" });
      return;
    }

    if (rowErrors.length) {
      invalidRows.push({ rowNumber, phone: clientPhoneNumber, clientName: ownerName, errors: rowErrors });
      return;
    }

    seenPhones.add(clientPhoneNumber);
    const hasBudgetRange = Object.prototype.hasOwnProperty.call(row, "budgetMin") || Object.prototype.hasOwnProperty.call(row, "budgetMax");
    const explicitBudgetRange =
      hasBudgetRange
        ? [row.budgetMin, row.budgetMax]
        : row.budget;
    const { budgetMin, budgetMax } = parseBudgetRange(explicitBudgetRange);
    const fallbackLocation = areaPreference || "Imported lead";

    candidates.push({
      rowNumber,
      phone: clientPhoneNumber,
      document: {
        ownerName,
        clientPhoneNumber,
        email: email || undefined,
        source,
        requirementType,
        areaPreference,
        assignedStaff,
        assignedTo: assignedStaff,
        leadStatus: "New Lead",
        interestLevel: "Warm",
        budgetMin,
        budgetMax,
        address: fallbackLocation,
        premiseName: requirementType || "Imported lead",
        premiseArea: fallbackLocation,
        sourceOfProperty: "Owner",
        propertyType: "2BHK",
        ownerPrice: budgetMax || budgetMin || 0,
        propertyCondition: "Unfurnished",
        propertyAge: "Not specified",
        propertySize: "Not specified",
        propertyStatus: "Available",
        dateOfAddingProperty: new Date(),
        createdBy: currentUser._id,
      },
    });
  });

  const existingClients = candidates.length
    ? await Client.find({ clientPhoneNumber: { $in: candidates.map((candidate) => candidate.phone) } }).select("ownerName clientPhoneNumber")
    : [];
  const existingPhoneMap = new Map(existingClients.map((client) => [client.clientPhoneNumber, client]));
  const insertable = [];

  candidates.forEach((candidate) => {
    const existingClient = existingPhoneMap.get(candidate.phone);

    if (existingClient) {
      duplicateRows.push({
        rowNumber: candidate.rowNumber,
        phone: candidate.phone,
        clientName: candidate.document.ownerName,
        existingClientName: existingClient.ownerName,
        reason: "Phone already exists",
      });
      return;
    }

    insertable.push(candidate.document);
  });

  const insertedClients = insertable.length ? await Client.insertMany(insertable, { ordered: false }) : [];

  return {
    imported: insertedClients.length,
    skipped: duplicateRows.length + invalidRows.length,
    duplicates: duplicateRows.length,
    invalid: invalidRows.length,
    totalRows: rows.length,
    duplicateRows,
    invalidRows,
  };
};

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
