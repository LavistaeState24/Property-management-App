import { Project } from "../models/Project.js";
import { ApiError } from "../utils/ApiError.js";
import { buildPagination, buildProjectFilters } from "../utils/query.js";

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

