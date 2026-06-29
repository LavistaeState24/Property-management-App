import { Router } from "express";

import {
  uploadFilesHandler,
  uploadLeadPropertyImagesHandler,
  uploadLeadPropertyVideoHandler,
} from "../controllers/uploadController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { imageUpload, upload, videoUpload } from "../middlewares/uploadMiddleware.js";

const router = Router();

router.post("/", protect, upload.array("files", 12), uploadFilesHandler);
router.post("/lead-property-images", protect, imageUpload.array("files", 15), uploadLeadPropertyImagesHandler);
router.post("/lead-property-video", protect, videoUpload.array("files", 1), uploadLeadPropertyVideoHandler);

export default router;
