import path from "path";
import { Readable } from "stream";
import cloudinary from "../config/cloudinary.js";
import { getMissingCloudinaryEnvVars, isCloudinaryConfigured } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const MAX_UPLOAD_SIZE_BYTES = 100 * 1024 * 1024;
const CHUNKED_UPLOAD_THRESHOLD_BYTES = 20 * 1024 * 1024;
const CHUNK_SIZE_BYTES = 6 * 1024 * 1024;

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

  const files = await Promise.all(
    req.files.map(
      (file) =>
        new Promise((resolve, reject) => {
          const safeFileName = file.originalname
            .replace(/\.[^/.]+$/, "")
            .replace(/\s+/g, "-")
            .replace(/[^a-zA-Z0-9-_]/g, "");

          const ext = path.extname(file.originalname).toLowerCase();
          const isPDF = file.mimetype === "application/pdf";
          const uploadOptions = {
            folder: "property-management-crm",
            resource_type: isPDF ? "raw" : "image",
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

          Readable.from(file.buffer).pipe(uploadStream);
        })
    )
  );

  res.status(201).json({
    success: true,
    data: files,
  });
});
