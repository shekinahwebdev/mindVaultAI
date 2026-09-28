function hostnameFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

export type IngestUrlLogPayload = {
  userId: string;
  ok: boolean;
  latencyMs: number;
  inputUrl: string;
  code?: string;
  redirectCount?: number;
  contentLength?: number;
  extractor?: string;
};

export function logIngestUrlOperation(payload: IngestUrlLogPayload): void {
  const hostname = hostnameFromUrl(payload.inputUrl);
  console.log("[ingest:url]", {
    operation: "ingest_url",
    userId: payload.userId,
    ok: payload.ok,
    latencyMs: payload.latencyMs,
    hostname,
    ...(payload.code ? { code: payload.code } : {}),
    ...(payload.redirectCount !== undefined ? { redirectCount: payload.redirectCount } : {}),
    ...(payload.contentLength !== undefined ? { contentLength: payload.contentLength } : {}),
    ...(payload.extractor ? { extractor: payload.extractor } : {}),
  });
}
