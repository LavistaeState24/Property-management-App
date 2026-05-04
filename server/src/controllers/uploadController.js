import path from "path";
import { Readable } from "stream";
import cloudinary from "../config/cloudinary.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const uploadFilesHandler = asyncHandler(async (req, res) => {
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
          const resourceType =
            file.mimetype === "application/pdf" ? "raw" : "auto";

          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "property-management-crm",
              resource_type: resourceType,
              type: "upload",
              access_mode: "public",
              use_filename: true,
              unique_filename: true,
            },
            (error, result) => {
              if (error) return reject(error);

              if (!result?.secure_url) {
                return reject(new Error("Cloudinary upload failed"));
              }

              resolve({
                name: file.originalname,
                filename: path.basename(result.public_id),
                url: result.secure_url, // ✅ save this in MongoDB
                publicId: result.public_id,
                resourceType: result.resource_type,
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