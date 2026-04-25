import { Router } from "express";

import {
  createClientHandler,
  deleteClientHandler,
  getClientHandler,
  listClientsHandler,
  updateClientHandler,
} from "../controllers/clientController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/", protect, listClientsHandler);
router.get("/:id", protect, getClientHandler);
router.post("/", protect, authorize("super-admin", "admin", "manager", "sales"), createClientHandler);
router.put("/:id", protect, authorize("super-admin", "admin", "manager", "sales"), updateClientHandler);
router.delete("/:id", protect, authorize("super-admin", "admin", "manager"), deleteClientHandler);

export default router;

