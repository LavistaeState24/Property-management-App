import { Project } from "../models/Project.js";
import { ApiError } from "../utils/ApiError.js";
import { buildPagination, buildProjectFilters } from "../utils/query.js";

const formatAssetUrl = (origin, assetUrl) => {
  if (!assetUrl) {
    return null;
  }

  if (/^https?:\/\//i.test(assetUrl)) {
    return assetUrl;
  }

  return `${origin}${assetUrl.startsWith("/") ? assetUrl : `/${assetUrl}`}`;
};

const formatIndianCurrency = (value) =>
  typeof value === "number" ? value.toLocaleString("en-IN") : null;

const formatDate = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};

export const createProject = async (payload, userId) =>
  Project.create({
    ...payload,
    createdBy: userId,
  });

export const getProjects = async (query) => {
  const filters = buildProjectFilters(query);
  const { page, limit, skip } = buildPagination(query);

  const [items, total] = await Promise.all([
    Project.find(filters)
      .populate("createdBy", "name role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Project.countDocuments(filters),
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

export const getProjectById = async (projectId) => {
  const project = await Project.findById(projectId).populate("createdBy", "name role");

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  return project;
};

export const getClientSafeProjectShare = async (projectId, user, origin) => {
  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const brochureUrl = formatAssetUrl(origin, project.brochure?.url);
  const photos = (project.projectImages || [])
    .map((image) => formatAssetUrl(origin, image?.url))
    .filter(Boolean);

  return {
    publicAlias: project.publicAlias,
    location: project.location,
    area: project.area,
    configuration: project.configuration || project.propertyType,
    size: project.sizeRange?.min && project.sizeRange?.max
      ? `${project.sizeRange.min} - ${project.sizeRange.max} ${project.sizeRange.unit || "sqft"}`
      : null,
    priceRange:
      project.priceRange?.min && project.priceRange?.max
        ? `₹${formatIndianCurrency(project.priceRange.min)} - ₹${formatIndianCurrency(project.priceRange.max)}`
        : null,
    possession: formatDate(project.possessionDate),
    amenities: project.amenities || [],
    brochureUrl,
    sampleVideoUrl: project.hasSampleVideo ? formatAssetUrl(origin, project.sampleVideoUrl) : null,
    photos,
    contact: {
      name: user.name,
      phone: user.phone,
    },
  };
};

export const updateProject = async (projectId, payload) => {
  const project = await Project.findByIdAndUpdate(projectId, payload, {
    new: true,
    runValidators: true,
  });

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  return project;
};

export const deleteProject = async (projectId) => {
  const project = await Project.findByIdAndDelete(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }
};

export const getDashboardSummary = async () => {
  const [totalProjects, activeProjects, upcomingProjects] = await Promise.all([
    Project.countDocuments(),
    Project.countDocuments({ status: "active" }),
    Project.countDocuments({ status: "upcoming" }),
  ]);

  return {
    totalProjects,
    activeProjects,
    upcomingProjects,
  };
};
