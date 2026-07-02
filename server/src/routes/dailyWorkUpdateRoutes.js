import { Router } from "express";

import {
  createDailyWorkUpdateHandler,
  deleteDailyWorkUpdateHandler,
  getCurrentDailyWorkUpdateHandler,
  getDailyWorkUpdateHandler,
  listDailyWorkUpdatesHandler,
  updateDailyWorkUpdateHandler,
} from "../controllers/dailyWorkUpdateController.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/", protect, authorize("dailyWorkUpdates", "view"), listDailyWorkUpdatesHandler);
router.post("/", protect, authorize("dailyWorkUpdates", "create"), createDailyWorkUpdateHandler);
router.get("/current", protect, authorize("dailyWorkUpdates", "view"), getCurrentDailyWorkUpdateHandler);
router.get("/:id", protect, authorize("dailyWorkUpdates", "view"), getDailyWorkUpdateHandler);
router.put("/:id", protect, authorize("dailyWorkUpdates", "update"), updateDailyWorkUpdateHandler);
router.delete("/:id", protect, authorize("dailyWorkUpdates", "delete"), deleteDailyWorkUpdateHandler);

export default router;
