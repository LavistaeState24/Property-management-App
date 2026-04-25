import { Router } from "express";

import {
  createProjectHandler,
  dashboardSummaryHandler,
  deleteProjectHandler,
  getProjectHandler,
  listProjectsHandler,
  updateProjectHandler,
} from "../controllers/projectController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/", protect, listProjectsHandler);
router.get("/dashboard-summary", protect, dashboardSummaryHandler);
router.get("/:id", protect, getProjectHandler);
router.post("/", protect, authorize("super-admin", "admin", "manager", "marketing"), createProjectHandler);
router.put("/:id", protect, authorize("super-admin", "admin", "manager", "marketing"), updateProjectHandler);
router.delete("/:id", protect, authorize("super-admin", "admin"), deleteProjectHandler);

export default router;

