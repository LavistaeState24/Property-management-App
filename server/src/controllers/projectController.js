import {
  createProject,
  deleteProject,
  getDashboardSummary,
  getProjectById,
  getClientSafeProjectShare,
  getProjects,
  updateProject,
} from "../services/projectService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createProjectHandler = asyncHandler(async (req, res) => {
  const project = await createProject(req.body, req.user._id);
  res.status(201).json({ success: true, data: project });
});

export const listProjectsHandler = asyncHandler(async (req, res) => {
  const result = await getProjects(req.query);
  res.json({ success: true, data: result });
});

export const getProjectHandler = asyncHandler(async (req, res) => {
  const project = await getProjectById(req.params.id);
  res.json({ success: true, data: project });
});

export const getClientSafeProjectShareHandler = asyncHandler(async (req, res) => {
  const origin = `${req.protocol}://${req.get("host")}`;
  const safeProject = await getClientSafeProjectShare(req.params.id, req.user, origin);
  res.json({ success: true, data: safeProject });
});

export const updateProjectHandler = asyncHandler(async (req, res) => {
  const project = await updateProject(req.params.id, req.body);
  res.json({ success: true, data: project });
});

export const deleteProjectHandler = asyncHandler(async (req, res) => {
  await deleteProject(req.params.id);
  res.json({ success: true, message: "Project deleted successfully" });
});

export const dashboardSummaryHandler = asyncHandler(async (_req, res) => {
  const summary = await getDashboardSummary();
  res.json({ success: true, data: summary });
});
