import { Router } from "express";

import authRoutes from "./authRoutes.js";
import clientRoutes from "./clientRoutes.js";
import followupRoutes from "./followupRoutes.js";
import projectRoutes from "./projectRoutes.js";
import shareRoutes from "./shareRoutes.js";
import uploadRoutes from "./uploadRoutes.js";
import userRoutes from "./userRoutes.js";
import shareRecordRoutes from "./shareRecordRoutes.js";


const router = Router();

router.use("/auth", authRoutes);
router.use("/projects", projectRoutes);
router.use("/users", userRoutes);
router.use("/clients", clientRoutes);
router.use("/followups", followupRoutes);
router.use("/share-links", shareRoutes);
router.use("/share-records", shareRecordRoutes);
router.use("/uploads", uploadRoutes);

export default router;
