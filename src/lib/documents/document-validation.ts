import {
  DOCUMENT_ALLOWED_MIME,
  DOCUMENT_MAX_SIZE_BYTES,
} from "./config";
import { parseUploadFilename } from "./filename-validation";

export function parseInitiateUploadBody(body: unknown):
  | { ok: true; filename: string; title: string; sizeBytes: number; mimeType: string }
  | { ok: false; message: string } {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, message: "Invalid request." };
  }

  const record = body as Record<string, unknown>;
  const filenameParsed = parseUploadFilename(record.filename);
  if (!filenameParsed.ok) {
    return filenameParsed;
  }

  const sizeBytes = record.sizeBytes;
  if (typeof sizeBytes !== "number" || !Number.isInteger(sizeBytes) || sizeBytes <= 0) {
    return { ok: false, message: "Invalid file size." };
  }

  if (sizeBytes > DOCUMENT_MAX_SIZE_BYTES) {
    return {
      ok: false,
      message: `File exceeds the maximum size of ${Math.floor(DOCUMENT_MAX_SIZE_BYTES / (1024 * 1024))} MB.`,
    };
  }

  const mimeType = typeof record.mimeType === "string" ? record.mimeType.trim() : "";
  if (mimeType !== DOCUMENT_ALLOWED_MIME) {
    return { ok: false, message: "Only PDF files are supported." };
  }

  return {
    ok: true,
    filename: filenameParsed.filename,
    title: filenameParsed.title,
    sizeBytes,
    mimeType: DOCUMENT_ALLOWED_MIME,
  };
}
