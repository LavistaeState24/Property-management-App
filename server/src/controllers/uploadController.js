import { put } from "@vercel/blob";
import { asyncHandler } from "../utils/asyncHandler.js";

export const uploadFilesHandler = asyncHandler(async (req, res) => {
  const files = await Promise.all(
    (req.files || []).map(async (file) => {
      const blob = await put(
        `uploads/${Date.now()}-${file.originalname}`,
        file.buffer,
        {
          access: "public",
          contentType: file.mimetype,
        }
      );

      return {
        name: file.originalname,
        filename: blob.pathname,
        url: blob.url,
      };
    })
  );

  res.status(201).json({
    success: true,
    data: files,
  });
});