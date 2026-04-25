import { Router } from "express";

import {
  createShareLinkHandler,
  getShareLinkPreviewHandler,
} from "../controllers/shareController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/", protect, createShareLinkHandler);
router.get("/public/:token", getShareLinkPreviewHandler);

export default router;

