import { Client } from "../models/Client.js";
import { CallLog } from "../models/CallLog.js";
import { Followup } from "../models/Followup.js";
import { Project } from "../models/Project.js";
import { ShareRecord } from "../models/ShareRecord.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { applyScopedFilter, getModuleScope } from "../utils/accessControl.js";
import { buildPagination, buildProjectFilters } from "../utils/query.js";
import {
  recordLeadChangeActivities,
  recordLeadCreatedActivity,
  recordShareActivity,
} from "./activityLogService.js";
import { buildClientSafeProjectPayload } from "./projectService.js";
import { buildClientSafeShareMessage } from "../utils/shareMessage.js";
import { createFollowup } from "./followupService.js";
import { EMAIL_REGEX, INDIAN_PHONE_REGEX, normalizeString } from "../validators/common.js";

const toObjectId = (value) => value?._id || value || null;
const toObjectIdString = (value) => String(toObjectId(value) || "");
const populateClientUsers = (query) =>
  query
    .populate("assignedStaff", "name role managerId")
    .populate("assignedTo", "name role managerId")
    .populate("createdBy", "name role");
const populatePositiveFollowupUsers = (query) => query.populate("assignedStaff", "name role");

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
  const parts = normalized.split(/\s*(?:-|to|â€“|â€”)\s*/i).filter(Boolean);
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

const getAccessibleClient = async (clientId, currentUser) => {
  const client = await Client.findById(clientId);

  if (!client) {
    throw new ApiError(404, "Client not found");
  }

  await assertClientAccess(client, currentUser);
  return client;
};

const normalizeToken = (value) => normalizeString(value).toLowerCase();

const propertyTypeKeywords = ["apartment", "villa", "plot", "commercial"];

const extractBhkTokens = (client) => {
  const sourceValues = [client.requirementType, client.propertyType];
  const tokens = sourceValues
    .flatMap((value) => String(value || "").match(/\d+\s*bhk/gi) || [])
    .map((value) => value.replace(/\s+/g, "").toUpperCase());

  return [...new Set(tokens)];
};

const extractPropertyTypeKeyword = (client) => {
  const sourceValues = [client.requirementType, client.propertyType];

  for (const sourceValue of sourceValues) {
    const normalized = normalizeToken(sourceValue);
    const matched = propertyTypeKeywords.find((keyword) => normalized.includes(keyword));

    if (matched) {
      return matched;
    }
  }

  return null;
};

const buildMatchingProjectQuery = (client, query) => {
  const bhkTokens = extractBhkTokens(client);
  const propertyTypeKeyword = extractPropertyTypeKeyword(client);

  return {
    area: query.area || client.areaPreference || client.premiseArea || undefined,
    propertyType: query.propertyType || propertyTypeKeyword || undefined,
    bhk: query.bhk || (bhkTokens.length ? bhkTokens.join(",") : undefined),
    status: query.status || "active",
    availability: query.availability ?? "true",
    minBudget: query.minBudget ?? client.budgetMin ?? undefined,
    maxBudget: query.maxBudget ?? client.budgetMax ?? undefined,
    minSize: query.minSize ?? undefined,
    maxSize: query.maxSize ?? undefined,
    possession: query.possession || undefined,
  };
};

const includesText = (value, expected) => normalizeToken(value).includes(normalizeToken(expected));

const getBudgetScore = (client, project) => {
  const clientMin = client.budgetMin ?? null;
  const clientMax = client.budgetMax ?? null;
  const projectMin = project.priceRange?.min ?? null;
  const projectMax = project.priceRange?.max ?? projectMin;

  if (!projectMin || (clientMin === null && clientMax === null)) {
    return 0;
  }

  const resolvedClientMin = clientMin ?? 0;
  const resolvedClientMax = clientMax ?? Number.MAX_SAFE_INTEGER;

  return projectMax >= resolvedClientMin && projectMin <= resolvedClientMax ? 2 : 0;
};

const getMatchInsights = (client, project) => {
  const matchedOn = [];
  let matchScore = 0;
  const bhkTokens = extractBhkTokens(client);
  const propertyTypeKeyword = extractPropertyTypeKeyword(client);

  const preferredArea = client.areaPreference || client.premiseArea;
  if (preferredArea && (includesText(project.area, preferredArea) || includesText(project.location, preferredArea))) {
    matchedOn.push("area");
    matchScore += 2;
  }

  if (
    bhkTokens.length &&
    bhkTokens.some(
      (token) =>
        normalizeToken(project.configuration).includes(token.toLowerCase()) ||
        (Array.isArray(project.propertyType) && project.propertyType.some((type) => normalizeToken(type).includes(token.toLowerCase()))),
    )
  ) {
    matchedOn.push("configuration");
    matchScore += 2;
  }

  const budgetScore = getBudgetScore(client, project);
  if (budgetScore) {
    matchedOn.push("budget");
    matchScore += budgetScore;
  }

  if (
    propertyTypeKeyword &&
    ((Array.isArray(project.propertyType) && project.propertyType.some((type) => normalizeToken(type).includes(propertyTypeKeyword))) ||
      includesText(project.configuration, propertyTypeKeyword) ||
      includesText(project.location, propertyTypeKeyword))
  ) {
    matchedOn.push("propertyType");
    matchScore += 1;
  }

  if ((project.availableUnits ?? 0) > 0) {
    matchedOn.push("availableUnits");
    matchScore += 1;
  }

  return { matchedOn, matchScore };
};

const sortMatchingProjects = (items, sortBy = "matchScore") => {
  return [...items].sort((left, right) => {
    const leftPrice = left.priceRange?.min ?? 0;
    const rightPrice = right.priceRange?.min ?? 0;
    const leftPossession = left.possessionDate ? new Date(left.possessionDate).getTime() : Number.MAX_SAFE_INTEGER;
    const rightPossession = right.possessionDate ? new Date(right.possessionDate).getTime() : Number.MAX_SAFE_INTEGER;
    const leftCreated = new Date(left.createdAt).getTime();
    const rightCreated = new Date(right.createdAt).getTime();

    switch (sortBy) {
      case "priceLowToHigh":
        return leftPrice - rightPrice;
      case "priceHighToLow":
        return rightPrice - leftPrice;
      case "possessionSoonest":
        return leftPossession - rightPossession;
      case "newest":
        return rightCreated - leftCreated;
      case "matchScore":
      default:
        if (right.matchScore !== left.matchScore) {
          return right.matchScore - left.matchScore;
        }

        return rightCreated - leftCreated;
    }
  });
};

const buildShareHistoryNote = ({ shareChannel, projectCount, reminderDateTime, createdByName }) =>
  `[${new Date().toISOString()}] Shared ${projectCount} matching project${projectCount === 1 ? "" : "s"} via ${shareChannel}. Follow-up scheduled for ${new Date(
    reminderDateTime,
  ).toISOString()}. Shared by ${createdByName}.`;

const buildSearchFilters = (search) =>
  search
    ? {
        $or: [
          { ownerName: { $regex: search, $options: "i" } },
          { clientPhoneNumber: { $regex: search, $options: "i" } },
          { premiseName: { $regex: search, $options: "i" } },
          { premiseArea: { $regex: search, $options: "i" } },
          { areaPreference: { $regex: search, $options: "i" } },
        ],
      }
    : {};

const buildBaseClientFilters = (query) => {
  const filters = buildSearchFilters(query.search);
  const andFilters = [];

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

  return andFilters.length ? { ...filters, $and: andFilters } : filters;
};

const combineWithVisibilityFilter = (baseFilters, visibilityFilter) =>
  Object.keys(baseFilters).length && Object.keys(visibilityFilter).length
    ? { $and: [baseFilters, visibilityFilter] }
    : Object.keys(baseFilters).length
      ? baseFilters
      : visibilityFilter;

const resolveActiveFollowupStatus = (followup) => {
  if (!followup) {
    return null;
  }

  const reminderDateTime = followup.reminderDateTime || followup.dueDate;

  if (followup.status === "Pending" && reminderDateTime && new Date(reminderDateTime) < new Date()) {
    return "Overdue";
  }

  return followup.status || "Pending";
};

const buildPositiveClientDetails = (client, nextFollowup, latestCallLog, latestShareRecord) => {
  const baseClient = typeof client.toObject === "function" ? client.toObject() : { ...client };

  return {
    ...baseClient,
    interestedProjects:
      latestShareRecord?.projectPublicAliases?.length
        ? latestShareRecord.projectPublicAliases
        : latestShareRecord?.projectPublicAlias
          ? [latestShareRecord.projectPublicAlias]
          : [],
    objections: latestCallLog?.objection || "",
    lastDiscussion: latestCallLog?.discussionSummary || baseClient.lastCallStatus || "",
    lastDiscussionAt: latestCallLog?.createdAt || null,
    nextActiveFollowup: nextFollowup
      ? {
          _id: nextFollowup._id,
          note: nextFollowup.note,
          reminderType: nextFollowup.reminderType,
          reminderDateTime: nextFollowup.reminderDateTime || nextFollowup.dueDate,
          status: resolveActiveFollowupStatus(nextFollowup),
          assignedStaff: nextFollowup.assignedStaff || null,
        }
      : null,
  };
};

export const createClient = async (payload, currentUser) => {
  const client = await Client.create({
    ...payload,
    assignedStaff: (await assertValidAssignee(payload.assignedStaff || currentUser._id, currentUser)) || currentUser._id,
    createdBy: currentUser._id,
  });

  await recordLeadCreatedActivity({
    lead: client,
    performedBy: currentUser._id,
    metadata: {
      assignedToName: currentUser.name,
    },
  });

  return client;
};

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
    const explicitBudgetRange = hasBudgetRange ? [row.budgetMin, row.budgetMax] : row.budget;
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

  if (insertedClients.length) {
    await Promise.all(
      insertedClients.map((client) =>
        recordLeadCreatedActivity({
          lead: client,
          performedBy: currentUser._id,
          metadata: {
            imported: true,
          },
        })
      )
    );
  }

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
  const { page, limit, skip } = buildPagination(query);
  const baseFilters = buildBaseClientFilters(query);
  const visibilityFilter = await buildClientVisibilityFilter(currentUser);
  const scopedFilters = combineWithVisibilityFilter(baseFilters, visibilityFilter);

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

export const getPositiveClients = async (query, currentUser) => {
  const { page, limit, skip } = buildPagination(query);
  const visibilityFilter = await buildClientVisibilityFilter(currentUser);
  const positiveFilters = buildBaseClientFilters(query);

  positiveFilters.$and = [
    ...(positiveFilters.$and || []),
    {
      $or: [{ budgetMin: { $gt: 0 } }, { budgetMax: { $gt: 0 } }],
    },
    {
      requirementType: { $regex: /\S/ },
    },
    {
      $or: [{ interestLevel: { $in: ["Hot", "Warm"] } }, { leadStatus: "Positive" }],
    },
  ];

  const activeClientIds = await Followup.distinct("client", { status: "Pending" });

  if (!activeClientIds.length) {
    return {
      items: [],
      meta: {
        page,
        limit,
        total: 0,
        totalPages: 0,
      },
    };
  }

  positiveFilters.$and.push({ _id: { $in: activeClientIds } });

  const scopedFilters = combineWithVisibilityFilter(positiveFilters, visibilityFilter);
  const [items, total] = await Promise.all([
    populateClientUsers(Client.find(scopedFilters))
      .sort({ updatedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Client.countDocuments(scopedFilters),
  ]);

  const normalizedItems = normalizeClients(items);
  const clientIds = normalizedItems.map((client) => client._id);

  if (!clientIds.length) {
    return {
      items: [],
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  const [activeFollowups, latestCallLogs, latestShareRecords] = await Promise.all([
    populatePositiveFollowupUsers(
      Followup.find({
        client: { $in: clientIds },
        status: "Pending",
      }).sort({ reminderDateTime: 1, dueDate: 1, createdAt: 1 }),
    ),
    CallLog.find({ client: { $in: clientIds } })
      .select("client discussionSummary objection createdAt")
      .sort({ createdAt: -1 }),
    ShareRecord.find({ client: { $in: clientIds } })
      .select("client projectPublicAlias projectPublicAliases createdAt")
      .sort({ createdAt: -1 }),
  ]);

  const nextFollowupByClient = new Map();
  const latestCallLogByClient = new Map();
  const latestShareRecordByClient = new Map();

  activeFollowups.forEach((followup) => {
    const clientId = toObjectIdString(followup.client);

    if (!nextFollowupByClient.has(clientId)) {
      nextFollowupByClient.set(clientId, followup);
    }
  });

  latestCallLogs.forEach((callLog) => {
    const clientId = toObjectIdString(callLog.client);

    if (!latestCallLogByClient.has(clientId)) {
      latestCallLogByClient.set(clientId, callLog);
    }
  });

  latestShareRecords.forEach((shareRecord) => {
    const clientId = toObjectIdString(shareRecord.client);

    if (!latestShareRecordByClient.has(clientId)) {
      latestShareRecordByClient.set(clientId, shareRecord);
    }
  });

  return {
    items: normalizedItems.map((client) =>
      buildPositiveClientDetails(
        client,
        nextFollowupByClient.get(toObjectIdString(client._id)),
        latestCallLogByClient.get(toObjectIdString(client._id)),
        latestShareRecordByClient.get(toObjectIdString(client._id)),
      ),
    ),
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

export const getMatchingProjectsForClient = async (clientId, query, currentUser, origin) => {
  const client = await getAccessibleClient(clientId, currentUser);
  const filters = buildProjectFilters(buildMatchingProjectQuery(client, query));
  const scopedFilters = applyScopedFilter(filters, getModuleScope(currentUser, "projects"), currentUser, {
    assigned: ["createdBy"],
    own: ["createdBy"],
  });
  const projects = await Project.find(scopedFilters).populate("createdBy", "name role");
  const scoredProjects = projects
    .map((project) => {
      const { matchedOn, matchScore } = getMatchInsights(client, project);

      return {
        ...project.toObject(),
        matchedOn,
        matchScore,
        sharePreview: buildClientSafeProjectPayload(project, currentUser, origin),
      };
    })
    .filter((project) => project.matchScore > 0 || projects.length === 1 || Object.keys(filters).length === 0);

  const sortBy = query.sortBy || "matchScore";
  const sortedProjects = sortMatchingProjects(scoredProjects, sortBy);
  const { page, limit, skip } = buildPagination(query);
  const items = sortedProjects.slice(skip, skip + limit);

  return {
    items,
    meta: {
      page,
      limit,
      total: sortedProjects.length,
      totalPages: Math.ceil(sortedProjects.length / limit) || 1,
    },
  };
};

export const getClientShareHistory = async (clientId, currentUser) => {
  await getAccessibleClient(clientId, currentUser);

  return ShareRecord.find({ client: clientId })
    .populate("sharedBy", "name role phone")
    .populate("projectId", "projectName publicAlias location status")
    .sort({ sharedAt: -1, createdAt: -1 });
};

export const shareMatchingProjectsWithClient = async (clientId, payload, currentUser, origin) => {
  const client = await getAccessibleClient(clientId, currentUser);
  const previousClient = client.toObject();
  const scopedFilters = applyScopedFilter({ _id: { $in: payload.projectIds } }, getModuleScope(currentUser, "projects"), currentUser, {
    assigned: ["createdBy"],
    own: ["createdBy"],
  });
  const projects = await Project.find(scopedFilters);

  if (projects.length !== payload.projectIds.length) {
    throw new ApiError(403, "One or more selected projects are not accessible");
  }

  const orderedProjects = payload.projectIds
    .map((projectId) => projects.find((project) => toObjectIdString(project._id) === String(projectId)))
    .filter(Boolean);

  if (!orderedProjects.length) {
    throw new ApiError(400, "At least one project is required");
  }

  const safeProjects = orderedProjects.map((project) => buildClientSafeProjectPayload(project, currentUser, origin));
  const message = buildClientSafeShareMessage(safeProjects, safeProjects[0]?.contact || {});
  const sharedProjects = safeProjects.map((project) => ({
    projectId: project.projectId,
    projectPublicAlias: project.publicAlias,
    sharedFields: {
      area: project.area,
      configuration: project.configuration,
      size: project.size,
      priceRange: project.priceRange,
      possession: project.possession,
      amenities: project.amenities?.map((item) => String(item).slice(0, 500)) || [],
      brochureUrl: project.brochureUrl,
      sampleVideoUrl: project.sampleVideoUrl,
      photos: project.photos || [],
    },
  }));

  let followup = null;
  let shareRecord = null;

  try {
    followup = await createFollowup(
      {
        client: client._id,
        assignedStaff: getAssignedUserId(client) || currentUser._id,
        reminderType: payload.reminderType,
        reminderDateTime: payload.reminderDateTime,
        note: payload.reminderNote,
        project: orderedProjects[0]?._id,
      },
      currentUser._id,
      currentUser,
    );

    shareRecord = await ShareRecord.create({
      client: client._id,
      clientName: client.ownerName,
      clientPhone: client.clientPhoneNumber,
      clientEmail: client.email || undefined,
      clientRequirement: payload.clientRequirement || client.requirementType || undefined,
      projectId: orderedProjects[0]._id,
      projectIds: orderedProjects.map((project) => project._id),
      projectPublicAlias: orderedProjects[0].publicAlias,
      projectPublicAliases: orderedProjects.map((project) => project.publicAlias),
      sharedBy: currentUser._id,
      sharedByName: currentUser.name,
      sharedByPhone: currentUser.phone,
      sharedFields: sharedProjects[0].sharedFields,
      sharedProjects,
      shareChannel: payload.shareChannel,
      sharedMessage: message,
      whatsappMessage: message,
      sharedAt: new Date(),
      status: "shared",
      followUpDate: payload.reminderDateTime,
      notes: payload.reminderNote,
    });

    client.leadStatus = "Details Sent";
    client.nextFollowUpDate = payload.reminderDateTime;
    client.internalNotes = [client.internalNotes, buildShareHistoryNote({
      shareChannel: payload.shareChannel,
      projectCount: orderedProjects.length,
      reminderDateTime: payload.reminderDateTime,
      createdByName: currentUser.name,
    })]
      .filter(Boolean)
      .join("\n\n");

    await client.save();

    await Promise.all([
      recordShareActivity({
        lead: client,
        shareRecord,
        performedBy: currentUser._id,
        metadata: {
          shareChannel: payload.shareChannel,
          projectCount: orderedProjects.length,
        },
      }),
      recordLeadChangeActivities({
        lead: client,
        before: previousClient,
        after: client,
        performedBy: currentUser._id,
        metadata: {
          source: "share-projects",
        },
      }),
    ]);

    return {
      message,
      safeProjects,
      shareRecord,
      followup,
      client: normalizeAssignedStaff(await populateClientUsers(Client.findById(client._id))),
    };
  } catch (error) {
    if (shareRecord?._id) {
      await ShareRecord.findByIdAndDelete(shareRecord._id);
    }

    if (followup?._id) {
      await Followup.findByIdAndDelete(followup._id);
    }

    throw error;
  }
};

export const updateClient = async (clientId, payload, currentUser) => {
  const client = await Client.findById(clientId);

  if (!client) {
    throw new ApiError(404, "Client not found");
  }

  await assertClientAccess(client, currentUser);
  const previousClient = client.toObject();

  if (Object.prototype.hasOwnProperty.call(payload, "assignedStaff")) {
    payload.assignedStaff = await assertValidAssignee(payload.assignedStaff, currentUser);
  }

  client.set(payload);
  await client.save();

  const updatedClient = normalizeAssignedStaff(await populateClientUsers(Client.findById(client._id)));

  await recordLeadChangeActivities({
    lead: updatedClient,
    before: previousClient,
    after: updatedClient,
    performedBy: currentUser._id,
  });

  return updatedClient;
};

export const deleteClient = async (clientId, currentUser) => {
  const client = await Client.findById(clientId);

  if (!client) {
    throw new ApiError(404, "Client not found");
  }

  await assertClientAccess(client, currentUser);

  await client.deleteOne();
};
