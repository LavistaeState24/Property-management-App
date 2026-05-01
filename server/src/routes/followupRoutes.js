import { Router } from "express";

import {
  createFollowupHandler,
  listFollowupsHandler,
} from "../controllers/followupController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";
import { validateBody } from "../middlewares/validationMiddleware.js";
import { validateFollowupInput } from "../validators/followupValidator.js";

const router = Router();

router.get("/", protect, authorize("followups", "view"), listFollowupsHandler);
router.post("/", protect, authorize("followups", "create"), validateBody(validateFollowupInput), createFollowupHandler);

export default router;
