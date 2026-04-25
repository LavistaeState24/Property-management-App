import { Router } from "express";

import { getUsers, login, me, register } from "../controllers/authController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, me);
router.get("/users", protect, authorize("super-admin", "admin"), getUsers);

export default router;

