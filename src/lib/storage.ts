/**
 * Object Storage — Cloudflare R2 via S3-compatible API
 *
 * Handles uploading, deleting, and URL generation for audio files,
 * images, and other assets. Falls back to local filesystem in development
 * when R2 is not configured.
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { logger } from "@/lib/logger";
import * as fs from "fs";
import * as path from "path";

let _client: S3Client | null = null;

function getR2Client(): S3Client | null {
  if (_client) return _client;

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    return null;
  }

  _client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  return _client;
}

function getBucket(): string {
  return process.env.R2_BUCKET_NAME || "truefans-assets";
}

/**
 * Get the public URL for an R2 object.
 * Uses custom domain if set, otherwise falls back to R2 public URL.
 */
function getPublicUrl(key: string): string {
  const publicDomain = process.env.R2_PUBLIC_URL;
  if (publicDomain) {
    return `${publicDomain.replace(/\/$/, "")}/${key}`;
  }
  // Fallback: R2 public bucket URL (must enable public access on the bucket)
  const accountId = process.env.R2_ACCOUNT_ID;
  const bucket = getBucket();
  return `https://${bucket}.${accountId}.r2.dev/${key}`;
}

/**
 * Upload a file to R2 storage.
 * Falls back to local filesystem if R2 is not configured.
 *
 * @param buffer - File contents
 * @param dir - Subdirectory (e.g., "voice-tracks", "commercials", "imaging")
 * @param filename - File name (e.g., "track-abc123.wav")
 * @returns Public URL for the uploaded file
 */
export async function uploadFile(
  buffer: Buffer,
  dir: string,
  filename: string
): Promise<string> {
  const client = getR2Client();
  const key = `audio/${dir}/${filename}`;

  if (client) {
    try {
      const contentType = filename.endsWith(".wav")
        ? "audio/wav"
        : filename.endsWith(".mp3")
          ? "audio/mpeg"
          : "application/octet-stream";

      await client.send(
        new PutObjectCommand({
          Bucket: getBucket(),
          Key: key,
          Body: buffer,
          ContentType: contentType,
        })
      );

      const url = getPublicUrl(key);
      logger.info("Uploaded to R2", { key, size: buffer.length });
      return url;
    } catch (error) {
      logger.error("R2 upload failed, falling back to local", { key, error });
    }
  }

  // Fallback: local filesystem (development or R2 not configured)
  return saveLocal(buffer, dir, filename);
}

/**
 * Upload an image to R2 storage.
 */
export async function uploadImage(
  buffer: Buffer,
  dir: string,
  filename: string
): Promise<string> {
  const client = getR2Client();
  const key = `${dir}/${filename}`;

  if (client) {
    try {
      const ext = path.extname(filename).toLowerCase();
      const contentType =
        ext === ".png" ? "image/png" :
        ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" :
        ext === ".webp" ? "image/webp" :
        ext === ".svg" ? "image/svg+xml" :
        "application/octet-stream";

      await client.send(
        new PutObjectCommand({
          Bucket: getBucket(),
          Key: key,
          Body: buffer,
          ContentType: contentType,
        })
      );

      return getPublicUrl(key);
    } catch (error) {
      logger.error("R2 image upload failed, falling back to local", { key, error });
    }
  }

  // Fallback: local
  const outputDir = path.join(process.cwd(), "public", dir);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, filename), buffer);
  return `/${dir}/${filename}`;
}

/**
 * Delete a file from R2 storage.
 */
export async function deleteFile(fileUrl: string): Promise<void> {
  const client = getR2Client();
  if (!client) return;

  // Extract key from URL
  const publicDomain = process.env.R2_PUBLIC_URL;
  let key: string | null = null;

  if (publicDomain && fileUrl.startsWith(publicDomain)) {
    key = fileUrl.slice(publicDomain.replace(/\/$/, "").length + 1);
  } else if (fileUrl.includes(".r2.dev/")) {
    key = fileUrl.split(".r2.dev/")[1];
  }

  if (!key) return;

  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: getBucket(),
        Key: key,
      })
    );
    logger.info("Deleted from R2", { key });
  } catch (error) {
    logger.error("R2 delete failed", { key, error });
  }
}

/**
 * Check if R2 storage is configured and available.
 */
export function isR2Configured(): boolean {
  return !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY
  );
}

/**
 * Local filesystem fallback (for development or serverless read-only fs).
 */
function saveLocal(buffer: Buffer, dir: string, filename: string): string {
  try {
    const outputDir = path.join(process.cwd(), "public", "audio", dir);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(path.join(outputDir, filename), buffer);
    return `/audio/${dir}/${filename}`;
  } catch {
    // Serverless (Netlify) — read-only filesystem, store as data URI
    const mimeType = filename.endsWith(".wav") ? "audio/wav" : "audio/mpeg";
    return `data:${mimeType};base64,${buffer.toString("base64")}`;
  }
}
