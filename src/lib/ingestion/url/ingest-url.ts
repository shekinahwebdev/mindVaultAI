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
import {
  fetchYouTubeOEmbedPreview,
  parseYouTubeIngestUrl,
} from "./youtube-oembed";
import { validateIngestUrlSafety } from "./validate-url";

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
  fetchYouTubeOEmbedPreview?: typeof fetchYouTubeOEmbedPreview;
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
async function ingestYouTubeUrl(
  url: string,
  fetchYouTube: typeof fetchYouTubeOEmbedPreview,
): Promise<IngestUrlResult> {
  if (!parseYouTubeIngestUrl(url)) {
    return { ok: false, code: "fetch_failed" };
  }

  const safety = await validateIngestUrlSafety(url);
  if (!safety.ok) {
    return { ok: false, code: safety.code };
  }

  const oembed = await fetchYouTube(safety.value.normalizedUrl);
  if (!oembed.ok) {
    return { ok: false, code: oembed.code };
  }

  const { value } = oembed;
  return {
    ok: true,
    redirectCount: 0,
    preview: {
      originalUrl: value.originalUrl,
      finalUrl: value.finalUrl,
      title: value.title,
      content: value.content,
      contentLength: value.contentLength,
      extractor: "youtube_oembed",
      warnings: ["youtube_oembed", "no_transcript"],
    },
  };
}

export async function ingestUrl(
  url: string,
  deps?: IngestUrlDeps,
): Promise<IngestUrlResult> {
  const fetchFn = deps?.fetchValidatedUrl ?? fetchValidatedUrl;
  const extractFn = deps?.extractContentFromFetch ?? extractContentFromFetch;
  const fetchYouTube = deps?.fetchYouTubeOEmbedPreview ?? fetchYouTubeOEmbedPreview;

  if (parseYouTubeIngestUrl(url)) {
    return ingestYouTubeUrl(url, fetchYouTube);
  }

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
