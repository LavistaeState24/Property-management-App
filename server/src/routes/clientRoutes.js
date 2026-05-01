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

router.get("/", protect, authorize("clients", "view"), listClientsHandler);
router.get("/:id", protect, authorize("clients", "view"), getClientHandler);
router.post("/", protect, authorize("clients", "create"), validateBody(validateClientInput), createClientHandler);
router.put("/:id", protect, authorize("clients", "update"), validateBody(validateClientInput), updateClientHandler);
router.delete("/:id", protect, authorize("clients", "delete"), deleteClientHandler);

export default router;
