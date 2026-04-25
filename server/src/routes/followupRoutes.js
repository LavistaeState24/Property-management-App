import { Router } from "express";

import {
  createFollowupHandler,
  listFollowupsHandler,
} from "../controllers/followupController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/", protect, listFollowupsHandler);
router.post("/", protect, createFollowupHandler);

export default router;

