import fs from "fs";
import path from "path";
import { promises as fsPromises } from "fs";
import cloudinary from "../config/cloudinary.js";
import { CHUNK_SIZE_BYTES, CHUNKED_UPLOAD_THRESHOLD_BYTES, MAX_UPLOAD_SIZE_BYTES } from "../config/upload.js";
import { getMissingCloudinaryEnvVars, isCloudinaryConfigured } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const normalizeCloudinaryBaseName = (filename) =>
  filename
    .replace(/\.[^/.]+$/, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-_]/g, "") || "upload";

const resolveCloudinaryResourceType = (mimetype) => {
  if (mimetype === "application/pdf") {
    return "raw";
  }

  if (mimetype?.startsWith("video/")) {
    return "video";
  }

  if (mimetype?.startsWith("image/")) {
    return "image";
  }

  return "raw";
};

const cleanupTempFile = async (filePath) => {
  if (!filePath) {
    return;
  }

  try {
    await fsPromises.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error(`Failed to remove temp upload file: ${filePath}`, error);
    }
  }
};

export const uploadFilesHandler = asyncHandler(async (req, res) => {
  if (!isCloudinaryConfigured()) {
    throw new ApiError(
      500,
      "Cloudinary is not configured correctly",
      null,
      {
        missingEnvVars: getMissingCloudinaryEnvVars(),
      }
    );
  }

  if (!req.files || !req.files.length) {
    return res.status(400).json({
      success: false,
      message: "No files uploaded",
    });
  }

  try {
    const files = await Promise.all(
      req.files.map(
        (file) =>
          new Promise((resolve, reject) => {
            if (file.size > MAX_UPLOAD_SIZE_BYTES) {
              return reject(
                new ApiError(
                  400,
                  `File size too large. Got ${file.size}. Maximum is ${MAX_UPLOAD_SIZE_BYTES}.`
                )
              );
            }
            const safeFileName = normalizeCloudinaryBaseName(file.originalname);
            const ext = path.extname(file.originalname).toLowerCase();
            const isPDF = file.mimetype === "application/pdf";
            const resourceType = resolveCloudinaryResourceType(file.mimetype);
            const uploadOptions = {
              folder: "property-management-crm",
              resource_type: resourceType,
              public_id: `${Date.now()}-${safeFileName}${isPDF ? ".pdf" : ext}`,
              use_filename: true,
              unique_filename: false,
            };

            const uploader =
              file.size > CHUNKED_UPLOAD_THRESHOLD_BYTES
                ? cloudinary.uploader.upload_chunked_stream
                : cloudinary.uploader.upload_stream;

            const uploadStream = uploader(
              {
                ...uploadOptions,
                chunk_size: CHUNK_SIZE_BYTES,
              },
              (error, result) => {
                if (error) return reject(error);

                if (!result?.secure_url) {
                  return reject(new Error("Cloudinary upload failed"));
                }

                resolve({
                  name: file.originalname,
                  filename: path.basename(result.public_id),
                  url: result.secure_url,
                  publicId: result.public_id,
                  resourceType: result.resource_type,
                  format: result.format,
                  size: result.bytes,
                });
              }
            );

            fs.createReadStream(file.path)
              .on("error", reject)
              .pipe(uploadStream);
          })
      )
    );

    res.status(201).json({
      success: true,
      data: files,
    });
  } finally {
    await Promise.all(req.files.map((file) => cleanupTempFile(file.path)));
  }
});
