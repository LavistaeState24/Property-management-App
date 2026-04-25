import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import express from "express";
import morgan from "morgan";
import path from "path";

import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorMiddleware.js";
import apiRoutes from "./routes/index.js";

const app = express();

app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use("/uploads", express.static(path.resolve("uploads")));

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "Server is healthy" });
});

app.use("/api/auth", authRoutes);
app.use("/api", apiRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

