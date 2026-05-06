import { allowedUploadMimeTypes, createUploadMiddleware } from "../config/upload.js";

export const upload = createUploadMiddleware({
  fileFilter: (_req, file, callback) => {
    if (!allowedUploadMimeTypes.includes(file.mimetype)) {
      return callback(
        new Error("Invalid file type. Only PDF, JPG, PNG, WEBP, MP4, and MOV are allowed."),
        false
      );
    }

    callback(null, true);
  },
});
