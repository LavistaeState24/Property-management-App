import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = path.dirname(currentFilePath);
const serverRoot = path.resolve(currentDirPath, "..", "..");
const nodeEnv = process.env.NODE_ENV || "development";

const envFiles = [
  `.env.${nodeEnv}.local`,
  ".env.local",
  `.env.${nodeEnv}`,
  ".env",
];

for (const envFile of envFiles) {
  dotenv.config({
    path: path.join(serverRoot, envFile),
    override: false,
  });
}

const parseClientUrls = (value) =>
  (value || "http://localhost:5173")
    .split(",")
    .map((entry) => entry.trim().replace(/\/+$/, ""))
    .filter(Boolean);

export const env = {
  nodeEnv,
  port: Number(process.env.PORT || 5000),

  mongoUri:
    process.env.MONGODB_URI ||
    (nodeEnv === "development"
      ? "mongodb://127.0.0.1:27017/property-management-crm"
      : ""),

  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",

  clientUrls: parseClientUrls(process.env.CLIENT_URL),

  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || "",
};

export const getMissingCloudinaryEnvVars = () => {
  const missing = [];

  if (!env.cloudinaryCloudName) missing.push("CLOUDINARY_CLOUD_NAME");
  if (!env.cloudinaryApiKey) missing.push("CLOUDINARY_API_KEY");
  if (!env.cloudinaryApiSecret) missing.push("CLOUDINARY_API_SECRET");

  return missing;
};

export const isCloudinaryConfigured = () => getMissingCloudinaryEnvVars().length === 0;

if (!env.mongoUri) {
  throw new Error("MONGODB_URI is not defined");
}

if (!env.jwtSecret) {
  throw new Error("JWT_SECRET is not defined");
}
