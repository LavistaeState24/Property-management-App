import { Router } from "express";

import { getUsers, login, me, register } from "../controllers/authController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";
import { validateBody } from "../middlewares/validationMiddleware.js";
import { validateLoginInput, validateRegisterInput } from "../validators/authValidator.js";

const router = Router();

router.post("/register", validateBody(validateRegisterInput), register);
router.post("/login", validateBody(validateLoginInput), login);
router.get("/me", protect, me);
router.get("/users", protect, authorize("super-admin", "admin"), getUsers);

export default router;
