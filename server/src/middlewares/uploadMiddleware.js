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

// import fs from "fs";
// import path from "path";

// import multer from "multer";

// const uploadDirectory = path.resolve("uploads");

// if (!fs.existsSync(uploadDirectory)) {
//   fs.mkdirSync(uploadDirectory, { recursive: true });
// }

// const storage = multer.diskStorage({
//   destination: (_req, _file, callback) => callback(null, uploadDirectory),
//   filename: (_req, file, callback) => {
//     const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`;
//     callback(null, uniqueName);
//   },
// });

// const allowedMimeTypes = [
//   "application/pdf",
//   "image/jpeg",
//   "image/png",
//   "image/webp",
//   "video/mp4",
//   "video/quicktime",
// ];

// export const upload = multer({
//   storage,
//   limits: {
//     fileSize: 50 * 1024 * 1024,
//   },
//   fileFilter: (_req, file, callback) => {
//     if (!allowedMimeTypes.includes(file.mimetype)) {
//       return callback(new Error("Only PDF, JPG, PNG, WEBP, and MP4/MOV files are allowed"));
//     }

//     callback(null, true);
//   },
// });

