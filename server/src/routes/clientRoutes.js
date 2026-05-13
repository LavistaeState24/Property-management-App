import { Router } from "express";

import {
  createClientCallLogHandler,
  listClientCallLogsHandler,
} from "../controllers/callLogController.js";
import {
  createClientHandler,
  deleteClientHandler,
  getClientHandler,
  importClientsHandler,
  listClientsHandler,
  updateClientHandler,
} from "../controllers/clientController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";
import { validateBody } from "../middlewares/validationMiddleware.js";
import { validateClientInput, validateClientUpdateInput } from "../validators/clientValidator.js";

const router = Router();

router.get("/", protect, authorize("clients", "view"), listClientsHandler);
router.post("/import", protect, authorize("clients", "create"), importClientsHandler);
router.get("/:id/call-logs", protect, authorize("clients", "view"), listClientCallLogsHandler);
router.post("/:id/call-logs", protect, authorize("clients", "update"), createClientCallLogHandler);
router.get("/:id", protect, authorize("clients", "view"), getClientHandler);
router.post("/", protect, authorize("clients", "create"), validateBody(validateClientInput), createClientHandler);
router.put(
  "/:id",
  protect,
  authorize("clients", "update"),
  (req, _res, next) => {
    try {
      req.body = validateClientUpdateInput(req.body, req.user);
      next();
    } catch (error) {
      next(error);
    }
  },
  updateClientHandler
);
router.delete("/:id", protect, authorize("clients", "delete"), deleteClientHandler);

export default router;
