import crypto from "crypto";
import path from "path";
import os from "os";
import { promises as fs } from "fs";
import { execFile } from "child_process";
import { promisify } from "util";

import {
    GetObjectCommand,
    ListObjectsV2Command,
    PutObjectCommand,
} from "@aws-sdk/client-s3";

import { env, isAwsS3Configured } from "../config/env.js";
import { s3Client } from "../config/s3.js";

const execFileAsync = promisify(execFile);

const PREFIX = process.env.PDF_MIGRATION_PREFIX || "uploads/";
const APPLY_CHANGES = process.env.PDF_MIGRATION_APPLY === "true";

const getGhostscriptCommand = () => {
    if (process.env.GHOSTSCRIPT_PATH) {
        return process.env.GHOSTSCRIPT_PATH;
    }

    return process.platform === "win32" ? "gswin64c" : "gs";
};

const cleanup = async (filePath) => {
    if (!filePath) return;

    try {
        await fs.unlink(filePath);
    } catch (error) {
        if (error.code !== "ENOENT") {
            console.error(`Unable to delete temp file: ${filePath}`, error);
        }
    }
};

const streamToBuffer = async (body) => {
    if (typeof body.transformToByteArray === "function") {
        const bytes = await body.transformToByteArray();
        return Buffer.from(bytes);
    }

    const chunks = [];

    for await (const chunk of body) {
        chunks.push(Buffer.from(chunk));
    }

    return Buffer.concat(chunks);
};

const flattenPdf = async (inputBuffer) => {
    const id = crypto.randomUUID();

    const inputPath = path.join(
        os.tmpdir(),
        `pdf-migration-input-${id}.pdf`
    );

    const outputPath = path.join(
        os.tmpdir(),
        `pdf-migration-output-${id}.pdf`
    );

    try {
        await fs.writeFile(inputPath, inputBuffer);

        await execFileAsync(
            getGhostscriptCommand(),
            [
                "-sDEVICE=pdfwrite",
                "-dCompatibilityLevel=1.4",
                "-dNOPAUSE",
                "-dBATCH",
                "-dSAFER",

                // Render visible annotations/stamps
                "-dShowAnnots=true",

                // Do not keep them as separate annotations.
                // Put their appearance into normal PDF page content.
                "-dPreserveAnnots=false",

                "-dPrinted=false",

                // Avoid unnecessary image downsampling
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

        const outputBuffer = await fs.readFile(outputPath);

        if (!outputBuffer.length) {
            throw new Error("Ghostscript created an empty PDF.");
        }

        return outputBuffer;
    } finally {
        await Promise.all([
            cleanup(inputPath),
            cleanup(outputPath),
        ]);
    }
};

const getAllPdfObjects = async () => {
    const objects = [];
    let continuationToken;

    do {
        const response = await s3Client.send(
            new ListObjectsV2Command({
                Bucket: env.awsS3Bucket,
                Prefix: PREFIX,
                ContinuationToken: continuationToken,
            })
        );

        for (const object of response.Contents || []) {
            if (object.Key?.toLowerCase().endsWith(".pdf")) {
                objects.push(object);
            }
        }

        continuationToken = response.IsTruncated
            ? response.NextContinuationToken
            : undefined;
    } while (continuationToken);

    return objects;
};

const processPdf = async (object, current, total) => {
    const key = object.Key;

    console.log(`\n[${current}/${total}] ${key}`);

    if (!APPLY_CHANGES) {
        console.log("DRY RUN - would flatten this PDF.");
        return {
            key,
            status: "dry-run",
        };
    }

    const response = await s3Client.send(
        new GetObjectCommand({
            Bucket: env.awsS3Bucket,
            Key: key,
        })
    );

    const originalBuffer = await streamToBuffer(response.Body);

    console.log(
        `Downloaded: ${(originalBuffer.length / 1024 / 1024).toFixed(2)} MB`
    );

    const flattenedBuffer = await flattenPdf(originalBuffer);

    console.log(
        `Flattened: ${(flattenedBuffer.length / 1024 / 1024).toFixed(2)} MB`
    );

    await s3Client.send(
        new PutObjectCommand({
            Bucket: env.awsS3Bucket,

            // IMPORTANT:
            // Same key means existing database URL remains unchanged.
            Key: key,

            Body: flattenedBuffer,
            ContentLength: flattenedBuffer.length,
            ContentType: response.ContentType || "application/pdf",

            // Preserve existing object headers where available.
            ...(response.CacheControl
                ? { CacheControl: response.CacheControl }
                : {}),

            ...(response.ContentDisposition
                ? { ContentDisposition: response.ContentDisposition }
                : {}),

            ...(response.ContentLanguage
                ? { ContentLanguage: response.ContentLanguage }
                : {}),

            Metadata: response.Metadata || {},
        })
    );

    console.log("✓ Flattened and overwritten successfully");

    return {
        key,
        status: "updated",
    };
};

const run = async () => {
    console.log("======================================");
    console.log(" Existing PDF Flatten Migration");
    console.log("======================================");

    if (!isAwsS3Configured()) {
        throw new Error("AWS S3 is not configured.");
    }

    console.log(`Bucket : ${env.awsS3Bucket}`);
    console.log(`Prefix : ${PREFIX}`);
    console.log(
        `Mode   : ${APPLY_CHANGES ? "APPLY / OVERWRITE" : "DRY RUN"}`
    );

    console.log("\nChecking Ghostscript...");

    const { stdout } = await execFileAsync(
        getGhostscriptCommand(),
        ["-version"],
        {
            windowsHide: true,
        }
    );

    console.log(stdout.trim());

    console.log("\nFinding PDFs...");

    const pdfObjects = await getAllPdfObjects();

    console.log(`Found ${pdfObjects.length} PDF(s).`);

    if (!pdfObjects.length) {
        console.log("Nothing to process.");
        return;
    }

    if (!APPLY_CHANGES) {
        console.log(
            "\nDRY RUN ONLY — no S3 files will be changed."
        );
    }

    let updated = 0;
    let failed = 0;

    for (let index = 0; index < pdfObjects.length; index += 1) {
        const object = pdfObjects[index];

        try {
            const result = await processPdf(
                object,
                index + 1,
                pdfObjects.length
            );

            if (result.status === "updated") {
                updated += 1;
            }
        } catch (error) {
            failed += 1;

            console.error(
                `✗ Failed: ${object.Key}`,
                error.message
            );
        }
    }

    console.log("\n======================================");
    console.log(" Migration Complete");
    console.log("======================================");
    console.log(`Total PDFs : ${pdfObjects.length}`);
    console.log(`Updated    : ${updated}`);
    console.log(`Failed     : ${failed}`);

    if (!APPLY_CHANGES) {
        console.log("\nNo files were changed.");
        console.log(
            "Set PDF_MIGRATION_APPLY=true to actually update them."
        );
    }
};

run()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error("\nMigration failed:", error);
        process.exit(1);
    });