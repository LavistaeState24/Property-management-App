import { asyncHandler } from "../utils/asyncHandler.js";

export const uploadFilesHandler = asyncHandler(async (req, res) => {
  const files = (req.files || []).map((file) => ({
    name: file.originalname,
    filename: file.filename,
    url: `/uploads/${file.filename}`,
  }));

  res.status(201).json({ success: true, data: files });
});

