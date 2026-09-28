import { readAuthJson } from "@/lib/auth/client";

import { CAPTURE_UNAUTHORIZED } from "./capture-config";

/** Client mirror of POST /api/ingest/url preview (no internal security fields). */
export type IngestUrlPreview = {
  originalUrl: string;
  finalUrl: string;
  title: string | null;
  content: string;
  contentLength: number;
  extractor: string;
  warnings: string[];
};

export type IngestUrlApiResponse =
  | { ok: true; preview: IngestUrlPreview }
  | { ok: false; message: string };

export async function ingestUrlRequest(url: string, signal?: AbortSignal) {
  const response = await fetch("/api/ingest/url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
    signal,
  });

  const data = await readAuthJson<IngestUrlApiResponse>(response);
  return { response, data };
}

export function messageForIngestResponse(
  response: Response,
  data: IngestUrlApiResponse | null,
  fallbackMessage: string,
): string {
  if (response.status === 401) {
    return CAPTURE_UNAUTHORIZED;
  }
  if (data && !data.ok && data.message) {
    return data.message;
  }
  return fallbackMessage;
}
