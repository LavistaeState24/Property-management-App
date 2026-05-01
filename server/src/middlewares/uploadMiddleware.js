import multer from "multer";

const allowedMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/quicktime",
];

export const upload = multer({
  storage: multer.memoryStorage(), 
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return callback(
        new Error("Only PDF, JPG, PNG, WEBP, and MP4/MOV files are allowed")
      );
    }

    callback(null, true);
  },
});
