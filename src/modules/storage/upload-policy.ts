export const allowedUploadMimeTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png",
  "image/jpeg",
  "text/plain",
]);

export class StorageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageValidationError";
  }
}

export function validateUploadPolicy(input: { mimeType: string; sizeBytes: number }, maxBytes: number) {
  if (!allowedUploadMimeTypes.has(input.mimeType)) throw new StorageValidationError("Unsupported file type");
  if (!Number.isSafeInteger(input.sizeBytes) || input.sizeBytes <= 0 || input.sizeBytes > maxBytes) throw new StorageValidationError("File exceeds the allowed size");
}

export function objectKeyBelongsToProject(storageKey: string, projectId: string) {
  return storageKey.startsWith(`projects/${projectId}/`);
}
