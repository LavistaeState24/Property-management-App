import { Router } from "express";

import { listUsersHandler } from "../controllers/userController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/", protect, authorize("super-admin", "admin"), listUsersHandler);

export default router;

