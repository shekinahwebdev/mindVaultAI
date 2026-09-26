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
