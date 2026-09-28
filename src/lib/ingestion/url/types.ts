/**
 * Structured outcomes for server-side URL ingestion safety checks.
 * Codes are stable for logging and API mapping; user-facing copy lives elsewhere.
 */

export type UrlSafetyErrorCode =
  | "invalid_url"
  | "unsupported_protocol"
  | "credentials_not_allowed"
  | "url_too_long"
  | "blocked_hostname"
  | "blocked_ip"
  | "dns_resolution_failed";

export type UrlSafetyFailure = {
  ok: false;
  code: UrlSafetyErrorCode;
};

export type ParsedIngestUrl = {
  url: URL;
  normalizedUrl: string;
  hostname: string;
};

export type SafeIngestUrl = ParsedIngestUrl & {
  resolvedAddresses: string[];
};

export type UrlSafetySuccess = {
  ok: true;
  value: SafeIngestUrl;
};

export type UrlSafetyResult = UrlSafetySuccess | UrlSafetyFailure;

export type ParseIngestUrlResult =
  | { ok: true; value: ParsedIngestUrl }
  | UrlSafetyFailure;

/** Max length aligned with note sourceUrl validation in note-validation.ts */
export const INGEST_URL_MAX_LENGTH = 2048;

export const ALLOWED_INGEST_PROTOCOLS = new Set(["http:", "https:"]);

/** Injectable DNS resolver for tests and future fetch pinning (Step 2). */
export type HostResolver = (hostname: string) => Promise<string[]>;

/** Fetch-layer failures (after URL safety passes). */
export type FetchErrorCode =
  | "timeout"
  | "fetch_failed"
  | "redirect_limit"
  | "redirect_loop"
  | "too_large"
  | "unsupported_content"
  | "invalid_redirect"
  | "binary_content";

export type FetchValidatedUrlFailure =
  | UrlSafetyFailure
  | {
      ok: false;
      code: FetchErrorCode;
      /** Upstream HTTP status when relevant (not for UI). */
      status?: number;
    };

export type FetchValidatedUrlSuccess = {
  ok: true;
  value: {
    originalUrl: string;
    finalUrl: string;
    status: number;
    contentType: string;
    body: string;
    byteLength: number;
    redirectCount: number;
  };
};

export type FetchValidatedUrlResult =
  | FetchValidatedUrlSuccess
  | FetchValidatedUrlFailure;

/** Default cap for raw/decompressed response bytes (Step 2). */
export const INGEST_FETCH_MAX_BODY_BYTES = 2 * 1024 * 1024;

/** Per-hop request timeout (ms). */
export const INGEST_FETCH_TIMEOUT_MS = 12_000;

/** Maximum redirect hops followed manually. */
export const INGEST_FETCH_MAX_REDIRECTS = 5;

/** Minimum non-whitespace characters for a useful extraction (Step 3). */
export const INGEST_EXTRACT_MIN_MEANINGFUL_CHARS = 150;

export type ExtractContentWarning =
  | "truncated"
  | "title_missing"
  | "dom_fallback";

export type ExtractContentExtractor = "readability" | "plain_text" | "dom_fallback";

export type ExtractContentErrorCode =
  | "extract_failed"
  | "insufficient_content"
  | "invalid_html";

export type ExtractContentInput = {
  originalUrl: string;
  finalUrl: string;
  contentType: string;
  body: string;
};

export type ExtractContentPreview = {
  originalUrl: string;
  finalUrl: string;
  title: string | null;
  content: string;
  contentLength: number;
  extractor: ExtractContentExtractor;
  warnings: ExtractContentWarning[];
  excerpt?: string;
  byline?: string;
};

export type ExtractContentResult =
  | { ok: true; value: ExtractContentPreview }
  | { ok: false; code: ExtractContentErrorCode };

/** Public preview DTO returned by POST /api/ingest/url (no raw HTML or IPs). */
export type IngestUrlPreview = {
  originalUrl: string;
  finalUrl: string;
  title: string | null;
  content: string;
  contentLength: number;
  extractor: ExtractContentExtractor;
  warnings: ExtractContentWarning[];
};
