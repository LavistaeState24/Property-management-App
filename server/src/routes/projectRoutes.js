import { Router } from "express";

import {
  createProjectHandler,
  dashboardSummaryHandler,
  deleteProjectHandler,
  getClientSafeProjectShareHandler,
  getProjectHandler,
  listProjectsHandler,
  updateProjectHandler,
} from "../controllers/projectController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";
import { validateBody } from "../middlewares/validationMiddleware.js";
import { validateProjectInput } from "../validators/projectValidator.js";

const router = Router();

router.get("/", protect, listProjectsHandler);
router.get("/dashboard-summary", protect, dashboardSummaryHandler);
router.get("/:id/client-share", protect, getClientSafeProjectShareHandler);
router.get("/:id", protect, getProjectHandler);
router.post("/", protect, authorize("super-admin", "admin", "manager", "marketing"), validateBody(validateProjectInput), createProjectHandler);
router.put("/:id", protect, authorize("super-admin", "admin", "manager", "marketing"), validateBody(validateProjectInput), updateProjectHandler);
router.delete("/:id", protect, authorize("super-admin", "admin"), deleteProjectHandler);

export default router;
