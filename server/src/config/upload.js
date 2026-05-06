import crypto from "crypto";
import fs from "fs";
import multer from "multer";
import os from "os";
import path from "path";

export const MAX_UPLOAD_SIZE_BYTES = 100 * 1024 * 1024;
export const CHUNKED_UPLOAD_THRESHOLD_BYTES = 20 * 1024 * 1024;
export const CHUNK_SIZE_BYTES = 6 * 1024 * 1024;
export const UPLOAD_TMP_DIR = path.join(os.tmpdir(), "property-management-crm", "uploads");

export const allowedUploadMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/quicktime",
];

const normalizeUploadBaseName = (filename) =>
  filename
    .replace(/\.[^/.]+$/, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-_]/g, "")
    .slice(0, 80) || "upload";

export const createUploadStorage = () =>
  multer.diskStorage({
    destination: (_req, _file, callback) => {
      fs.mkdir(UPLOAD_TMP_DIR, { recursive: true }, (error) => {
        callback(error, UPLOAD_TMP_DIR);
      });
    },
    filename: (_req, file, callback) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const baseName = normalizeUploadBaseName(file.originalname);

      callback(null, `${Date.now()}-${baseName}-${crypto.randomUUID()}${ext}`);
    },
  });

export const createUploadMiddleware = ({ fileFilter } = {}) =>
  multer({
    storage: createUploadStorage(),
    limits: {
      fileSize: MAX_UPLOAD_SIZE_BYTES,
    },
    ...(fileFilter ? { fileFilter } : {}),
  });
