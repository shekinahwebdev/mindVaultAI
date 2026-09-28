import { INGEST_URL_MAX_LENGTH } from "./types";

export const INGEST_INVALID_REQUEST = "Invalid request.";
export const INGEST_URL_REQUIRED = "A URL is required.";
export const INGEST_URL_TOO_LONG = "URL is too long.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseIngestUrlRequestBody(
  body: unknown,
): { success: true; url: string } | { success: false; message: string } {
  if (!isRecord(body) || typeof body.url !== "string") {
    return { success: false, message: INGEST_INVALID_REQUEST };
  }

  const url = body.url.trim();

  if (!url) {
    return { success: false, message: INGEST_URL_REQUIRED };
  }

  if (url.length > INGEST_URL_MAX_LENGTH) {
    return { success: false, message: INGEST_URL_TOO_LONG };
  }

  return { success: true, url };
}
