import { sanitizeDisplayFilename } from "./filename-validation";

/**
 * Server-generated S3 object key — never accept client-provided paths.
 * Format: users/{userId}/documents/{documentId}/{uuid}.pdf
 */
export function buildDocumentStorageKey(userId: string, documentId: string, originalFilename: string): string {
  const safeName = sanitizeDisplayFilename(originalFilename)
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "_")
    .slice(0, 80);
  const suffix = safeName.endsWith(".pdf") ? safeName : `${safeName}.pdf`;
  const unique = crypto.randomUUID();
  return `users/${userId}/documents/${documentId}/${unique}-${suffix}`;
}
