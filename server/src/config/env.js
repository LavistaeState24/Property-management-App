import dotenv from "dotenv";

dotenv.config();

const parseClientUrls = (value) =>
  (value || "http://localhost:5173")
    .split(",")
    .map((entry) => entry.trim().replace(/\/+$/, ""))
    .filter(Boolean);

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),

  mongoUri:
    process.env.MONGODB_URI ||
    (process.env.NODE_ENV === "development"
      ? "mongodb://127.0.0.1:27017/property-management-crm"
      : ""),

  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",

  clientUrls: parseClientUrls(process.env.CLIENT_URL),

  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || "",
};

if (!env.mongoUri) {
  throw new Error("MONGODB_URI is not defined");
}

if (!env.jwtSecret) {
  throw new Error("JWT_SECRET is not defined");
}
