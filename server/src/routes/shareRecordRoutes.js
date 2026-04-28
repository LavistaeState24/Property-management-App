import { Router } from "express";

import {
  createShareRecordHandler,
  getShareRecordsByClientPhoneHandler,
  getShareRecordsByProjectIdHandler,
  listShareRecordsHandler,
  updateShareRecordNotesHandler,
  updateShareRecordStatusHandler,
} from "../controllers/shareRecordController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { validateBody } from "../middlewares/validationMiddleware.js";
import {
  validateShareRecordCreateInput,
  validateShareRecordNotesInput,
  validateShareRecordStatusInput,
} from "../validators/shareRecordValidator.js";

const router = Router();

router.get("/", protect, listShareRecordsHandler);
router.get("/client/:clientPhone", protect, getShareRecordsByClientPhoneHandler);
router.get("/project/:projectId", protect, getShareRecordsByProjectIdHandler);
router.post("/", protect, validateBody(validateShareRecordCreateInput), createShareRecordHandler);
router.patch("/:id/status", protect, validateBody(validateShareRecordStatusInput), updateShareRecordStatusHandler);
router.patch("/:id/notes", protect, validateBody(validateShareRecordNotesInput), updateShareRecordNotesHandler);

export default router;
