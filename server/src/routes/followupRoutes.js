import { Router } from "express";

import {
  createFollowupHandler,
  listFollowupsHandler,
} from "../controllers/followupController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { validateBody } from "../middlewares/validationMiddleware.js";
import { validateFollowupInput } from "../validators/followupValidator.js";

const router = Router();

router.get("/", protect, listFollowupsHandler);
router.post("/", protect, validateBody(validateFollowupInput), createFollowupHandler);

export default router;
