import type { SessionData } from "@/lib/auth/session";
import { UNAUTHORIZED_MESSAGE } from "@/lib/auth/guards";

import {
  ingestFailureHttpStatus,
  ingestFailureMessage,
  type IngestFailureCode,
} from "./ingest-errors";
import { logIngestUrlOperation } from "./ingest-log";
import { ingestUrl, type IngestUrlDeps, type IngestUrlResult } from "./ingest-url";
import { parseIngestUrlRequestBody } from "./ingest-validation";
import type { IngestUrlPreview } from "./types";

export type IngestUrlApiSuccess = {
  ok: true;
  preview: IngestUrlPreview;
};

export type IngestUrlApiFailure = {
  ok: false;
  message: string;
};

export type IngestUrlApiResponse = IngestUrlApiSuccess | IngestUrlApiFailure;

export type IngestUrlHandlerResult = {
  status: number;
  body: IngestUrlApiResponse;
};

export type IngestUrlHandlerDeps = IngestUrlDeps & {
  ingestUrl?: (url: string, deps?: IngestUrlDeps) => Promise<IngestUrlResult>;
};

function mapFailure(result: Extract<IngestUrlResult, { ok: false }>): IngestUrlHandlerResult {
  const code = result.code as IngestFailureCode;
  return {
    status: ingestFailureHttpStatus(code),
    body: { ok: false, message: ingestFailureMessage(code) },
  };
}

/**
 * Testable request handler for POST /api/ingest/url (no NextResponse).
 */
export async function handleIngestUrlRequest(options: {
  session: SessionData | null;
  body: unknown;
  deps?: IngestUrlHandlerDeps;
}): Promise<IngestUrlHandlerResult> {
  const startedAt = Date.now();

  if (!options.session) {
    return {
      status: 401,
      body: { ok: false, message: UNAUTHORIZED_MESSAGE },
    };
  }

  const parsed = parseIngestUrlRequestBody(options.body);
  if (!parsed.success) {
    return {
      status: 400,
      body: { ok: false, message: parsed.message },
    };
  }

  const runIngest = options.deps?.ingestUrl ?? ingestUrl;
  const pipelineDeps: IngestUrlDeps | undefined = options.deps
    ? {
        fetchValidatedUrl: options.deps.fetchValidatedUrl,
        extractContentFromFetch: options.deps.extractContentFromFetch,
        fetchOptions: options.deps.fetchOptions,
      }
    : undefined;
  const result = await runIngest(parsed.url, pipelineDeps);

  const latencyMs = Date.now() - startedAt;

  if (!result.ok) {
    logIngestUrlOperation({
      userId: options.session.userId,
      ok: false,
      latencyMs,
      inputUrl: parsed.url,
      code: result.code,
    });
    return mapFailure(result);
  }

  logIngestUrlOperation({
    userId: options.session.userId,
    ok: true,
    latencyMs,
    inputUrl: parsed.url,
    redirectCount: result.redirectCount,
    contentLength: result.preview.contentLength,
    extractor: result.preview.extractor,
  });

  return {
    status: 200,
    body: { ok: true, preview: result.preview },
  };
}
