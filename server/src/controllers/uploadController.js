import path from "path";
import { promises as fsPromises } from "fs";
import fs from "fs";
import crypto from "crypto";
import os from "os";
import { execFile } from "child_process";
import { promisify } from "util";

import { PutObjectCommand } from "@aws-sdk/client-s3";

import {
  env,
  getMissingAwsS3EnvVars,
  isAwsS3Configured,
} from "../config/env.js";

import { buildS3ObjectUrl, s3Client } from "../config/s3.js";
import { MAX_UPLOAD_SIZE_BYTES } from "../config/upload.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const execFileAsync = promisify(execFile);

const normalizeUploadBaseName = (filename) =>
  filename
    .replace(/\.[^/.]+$/, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-_]/g, "") || "upload";

const createS3ObjectKey = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  const baseName = normalizeUploadBaseName(filename);
  const datePrefix = new Date().toISOString().slice(0, 10);

  return `uploads/${datePrefix}/${Date.now()}-${baseName}-${crypto.randomUUID()}${ext}`;
};

const cleanupTempFile = async (filePath) => {
  if (!filePath) return;

  try {
    await fsPromises.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error(`Failed to remove temp file: ${filePath}`, error);
    }
  }
};

const getGhostscriptCommand = () => {
  // Optional custom path through environment variable
  if (process.env.GHOSTSCRIPT_PATH) {
    return process.env.GHOSTSCRIPT_PATH;
  }

  return process.platform === "win32" ? "gswin64c" : "gs";
};

/**
 * Converts annotations/stamps into normal PDF page content.
 * This fixes PDFs where Android Chrome does not display Stamp annotations.
 */
const flattenPdfForAndroid = async (inputPath) => {
  const outputPath = path.join(
    os.tmpdir(),
    `flattened-${Date.now()}-${crypto.randomUUID()}.pdf`
  );

  try {
    await execFileAsync(
      getGhostscriptCommand(),
      [
        "-sDEVICE=pdfwrite",
        "-dCompatibilityLevel=1.4",
        "-dNOPAUSE",
        "-dBATCH",
        "-dSAFER",

        // Show annotations while processing
        "-dShowAnnots=true",

        // IMPORTANT:
        // Convert annotations/stamps into actual page content
        "-dPreserveAnnots=false",

        // Prevent unnecessary image quality reduction
        "-dDownsampleColorImages=false",
        "-dDownsampleGrayImages=false",
        "-dDownsampleMonoImages=false",

        `-sOutputFile=${outputPath}`,
        inputPath,
      ],
      {
        windowsHide: true,
        maxBuffer: 20 * 1024 * 1024,
      }
    );

    const stats = await fsPromises.stat(outputPath);

    if (!stats.size) {
      throw new Error("Flattened PDF is empty");
    }

    return {
      path: outputPath,
      size: stats.size,
    };
  } catch (error) {
    await cleanupTempFile(outputPath);

    console.error("PDF flattening error:", error);

    throw new ApiError(
      500,
      "PDF processing failed. Ghostscript may not be installed."
    );
  }
};

export const uploadFilesHandler = asyncHandler(async (req, res) => {
  if (!isAwsS3Configured()) {
    throw new ApiError(
      500,
      "AWS S3 is not configured correctly",
      null,
      {
        missingEnvVars: getMissingAwsS3EnvVars(),
      }
    );
  }

  if (!req.files || !req.files.length) {
    return res.status(400).json({
      success: false,
      message: "No files uploaded",
    });
  }

  try {
    const files = await Promise.all(
      req.files.map(async (file) => {
        if (file.size > MAX_UPLOAD_SIZE_BYTES) {
          throw new ApiError(
            400,
            `File size too large. Got ${file.size}. Maximum is ${MAX_UPLOAD_SIZE_BYTES}.`
          );
        }

        const key = createS3ObjectKey(file.originalname);

        let uploadPath = file.path;
        let uploadSize = file.size;
        let flattenedPath = null;

        try {
          const isPdf =
            file.mimetype === "application/pdf" ||
            path.extname(file.originalname).toLowerCase() === ".pdf";

          // -----------------------------
          // ANDROID PDF FIX
          // -----------------------------
          if (isPdf) {
            const flattened = await flattenPdfForAndroid(file.path);

            uploadPath = flattened.path;
            uploadSize = flattened.size;
            flattenedPath = flattened.path;

            console.log(
              `PDF flattened for Android compatibility: ${file.originalname}`
            );
          }

          await s3Client.send(
            new PutObjectCommand({
              Bucket: env.awsS3Bucket,
              Key: key,

              // For PDFs this is now the flattened file
              Body: fs.createReadStream(uploadPath),

              ContentType: file.mimetype,
              ContentLength: uploadSize,

              Metadata: {
                originalname: file.originalname,
              },
            })
          );

          const url = buildS3ObjectUrl(
            env.awsS3Bucket,
            env.awsRegion,
            key
          );

          return {
            name: file.originalname,
            filename: path.basename(key),
            url,
            key,
            mimetype: file.mimetype,
            size: uploadSize,
          };
        } finally {
          if (flattenedPath) {
            await cleanupTempFile(flattenedPath);
          }
        }
      })
    );

    res.status(201).json({
      success: true,
      data: files,
    });
  } finally {
    await Promise.all(
      req.files.map((file) => cleanupTempFile(file.path))
    );
  }
});

export const uploadLeadPropertyImagesHandler = uploadFilesHandler;
export const uploadLeadPropertyVideoHandler = uploadFilesHandler;