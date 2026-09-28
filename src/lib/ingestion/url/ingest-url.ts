import { extractContentFromFetch } from "./extract-content";
import type { IngestFailureCode } from "./ingest-errors";
import { fetchValidatedUrl, type FetchValidatedUrlOptions } from "./fetch-url";
import type {
  ExtractContentPreview,
  ExtractContentResult,
  FetchValidatedUrlSuccess,
  FetchValidatedUrlResult,
  IngestUrlPreview,
} from "./types";

export type IngestUrlResult =
  | { ok: true; preview: IngestUrlPreview; redirectCount: number }
  | { ok: false; code: IngestFailureCode };

export type IngestUrlDeps = {
  fetchValidatedUrl?: (
    url: string,
    options?: FetchValidatedUrlOptions,
  ) => Promise<FetchValidatedUrlResult>;
  extractContentFromFetch?: (
    fetchValue: FetchValidatedUrlSuccess["value"],
  ) => ExtractContentResult;
  fetchOptions?: FetchValidatedUrlOptions;
};

function toPreview(value: ExtractContentPreview): IngestUrlPreview {
  return {
    originalUrl: value.originalUrl,
    finalUrl: value.finalUrl,
    title: value.title,
    content: value.content,
    contentLength: value.contentLength,
    extractor: value.extractor,
    warnings: value.warnings,
  };
}

/**
 * Orchestrates validate → fetch → extract. No auth, logging, HTTP, DB, or AI.
 */
export async function ingestUrl(
  url: string,
  deps?: IngestUrlDeps,
): Promise<IngestUrlResult> {
  const fetchFn = deps?.fetchValidatedUrl ?? fetchValidatedUrl;
  const extractFn = deps?.extractContentFromFetch ?? extractContentFromFetch;

  const fetchResult = await fetchFn(url, deps?.fetchOptions);
  if (!fetchResult.ok) {
    return { ok: false, code: fetchResult.code };
  }

  const extractResult = extractFn(fetchResult.value);
  if (!extractResult.ok) {
    return { ok: false, code: extractResult.code };
  }

  return {
    ok: true,
    preview: toPreview(extractResult.value),
    redirectCount: fetchResult.value.redirectCount,
  };
}
