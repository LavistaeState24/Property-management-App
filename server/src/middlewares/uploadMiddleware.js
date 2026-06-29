import {
  allowedImageUploadMimeTypes,
  allowedUploadMimeTypes,
  allowedVideoUploadMimeTypes,
  createUploadMiddleware,
} from "../config/upload.js";

export const upload = createUploadMiddleware({
  fileFilter: (_req, file, callback) => {
    if (!allowedUploadMimeTypes.includes(file.mimetype)) {
      return callback(
        new Error(
          "Invalid file type. Only PDFs, images, videos, and common office documents are allowed."
        ),
        false
      );
    }

    callback(null, true);
  },
});

export const imageUpload = createUploadMiddleware({
  fileFilter: (_req, file, callback) => {
    if (!allowedImageUploadMimeTypes.includes(file.mimetype)) {
      return callback(new Error("Invalid file type. Only image files are allowed."), false);
    }

    callback(null, true);
  },
});

export const videoUpload = createUploadMiddleware({
  fileFilter: (_req, file, callback) => {
    if (!allowedVideoUploadMimeTypes.includes(file.mimetype)) {
      return callback(new Error("Invalid file type. Only video files are allowed."), false);
    }

    callback(null, true);
  },
});
