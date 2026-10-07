import "server-only";
import { randomUUID } from "node:crypto";
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client, type HeadObjectCommandOutput } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getServerEnv } from "@/lib/env";
import { objectKeyBelongsToProject, StorageValidationError, validateUploadPolicy } from "./upload-policy";

function storageConfig() {
  const env = getServerEnv();
  if (!env.S3_ENDPOINT || !env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY) throw new Error("Private object storage is not configured");
  return { ...env, S3_ENDPOINT: env.S3_ENDPOINT, S3_ACCESS_KEY_ID: env.S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY: env.S3_SECRET_ACCESS_KEY };
}

function client() {
  const env = storageConfig();
  return new S3Client({
    endpoint: env.S3_ENDPOINT,
    region: env.S3_REGION,
    forcePathStyle: env.S3_FORCE_PATH_STYLE,
    credentials: { accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY },
  });
}

export function validateUpload(input: { mimeType: string; sizeBytes: number }) {
  const env = getServerEnv();
  validateUploadPolicy(input, env.MAX_UPLOAD_BYTES);
}

export async function createPrivateUploadUrl(input: { projectId: string; originalName: string; mimeType: string; sizeBytes: number }) {
  validateUpload(input);
  const env = storageConfig();
  const extension = input.originalName.includes(".") ? `.${input.originalName.split(".").pop()!.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10)}` : "";
  const storageKey = `projects/${input.projectId}/${new Date().getUTCFullYear()}/${randomUUID()}${extension}`;
  const command = new PutObjectCommand({ Bucket: env.S3_BUCKET, Key: storageKey, ContentType: input.mimeType, ContentLength: input.sizeBytes });
  const url = await getSignedUrl(client(), command, { expiresIn: env.SIGNED_URL_TTL_SECONDS });
  return { storageKey, url, expiresIn: env.SIGNED_URL_TTL_SECONDS };
}

export async function createPrivateDownloadUrl(storageKey: string, fileName: string) {
  const env = storageConfig();
  const safeName = fileName.replace(/[\r\n"\\]/g, "_");
  const command = new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: storageKey, ResponseContentDisposition: `attachment; filename="${safeName}"` });
  return getSignedUrl(client(), command, { expiresIn: env.SIGNED_URL_TTL_SECONDS });
}

export async function confirmPrivateUpload(input: { projectId: string; storageKey: string; mimeType: string; sizeBytes: number }) {
  validateUpload(input);
  if (!objectKeyBelongsToProject(input.storageKey, input.projectId)) throw new StorageValidationError("Object key is outside the project scope");
  const env = storageConfig();
  let object: HeadObjectCommandOutput;
  try {
    object = await client().send(new HeadObjectCommand({ Bucket: env.S3_BUCKET, Key: input.storageKey }));
  } catch (error) {
    const status = error && typeof error === "object" && "$metadata" in error
      ? (error.$metadata as { httpStatusCode?: number }).httpStatusCode
      : undefined;
    if (status === 404) throw new StorageValidationError("Uploaded object was not found");
    throw error;
  }
  if (object.ContentLength !== input.sizeBytes || object.ContentType !== input.mimeType) throw new StorageValidationError("Uploaded object metadata does not match the request");
  return { checksum: object.ChecksumSHA256 ?? object.ETag?.replaceAll('"', "") ?? null };
}
