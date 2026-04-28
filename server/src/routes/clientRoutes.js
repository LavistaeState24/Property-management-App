import { Router } from "express";

import {
  createClientHandler,
  deleteClientHandler,
  getClientHandler,
  listClientsHandler,
  updateClientHandler,
} from "../controllers/clientController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";
import { validateBody } from "../middlewares/validationMiddleware.js";
import { validateClientInput } from "../validators/clientValidator.js";

const router = Router();

router.get("/", protect, listClientsHandler);
router.get("/:id", protect, getClientHandler);
router.post("/", protect, authorize("super-admin", "admin", "manager", "sales"), validateBody(validateClientInput), createClientHandler);
router.put("/:id", protect, authorize("super-admin", "admin", "manager", "sales"), validateBody(validateClientInput), updateClientHandler);
router.delete("/:id", protect, authorize("super-admin", "admin", "manager"), deleteClientHandler);

export default router;
