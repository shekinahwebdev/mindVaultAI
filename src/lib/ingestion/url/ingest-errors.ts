import type {
  ExtractContentErrorCode,
  FetchErrorCode,
  UrlSafetyErrorCode,
} from "./types";

export type IngestFailureCode =
  | UrlSafetyErrorCode
  | FetchErrorCode
  | ExtractContentErrorCode;

export const INGEST_CLIENT_MESSAGES: Record<IngestFailureCode, string> = {
  invalid_url: "This URL can't be imported.",
  unsupported_protocol: "This URL can't be imported.",
  credentials_not_allowed: "This URL can't be imported.",
  url_too_long: "This URL can't be imported.",
  blocked_hostname: "This URL can't be imported.",
  blocked_ip: "This URL can't be imported.",
  dns_resolution_failed: "MindVault couldn't reach this page.",
  timeout: "The page took too long to respond.",
  fetch_failed: "MindVault couldn't retrieve this page.",
  redirect_limit: "MindVault couldn't retrieve this page.",
  redirect_loop: "MindVault couldn't retrieve this page.",
  invalid_redirect: "MindVault couldn't retrieve this page.",
  too_large: "This page is too large to import.",
  unsupported_content: "This type of content isn't supported yet.",
  binary_content: "This type of content isn't supported yet.",
  extract_failed: "MindVault couldn't read this page.",
  insufficient_content: "MindVault couldn't find enough readable content on this page.",
  invalid_html: "MindVault couldn't read this page.",
};

export function ingestFailureHttpStatus(code: IngestFailureCode): number {
  switch (code) {
    case "invalid_url":
    case "unsupported_protocol":
    case "credentials_not_allowed":
    case "url_too_long":
      return 400;
    case "blocked_hostname":
    case "blocked_ip":
      return 403;
    case "timeout":
      return 504;
    case "too_large":
      return 413;
    case "unsupported_content":
    case "binary_content":
      return 415;
    case "extract_failed":
    case "insufficient_content":
    case "invalid_html":
      return 422;
    case "dns_resolution_failed":
    case "fetch_failed":
    case "redirect_limit":
    case "redirect_loop":
    case "invalid_redirect":
    default:
      return 502;
  }
}

export function ingestFailureMessage(code: IngestFailureCode): string {
  return INGEST_CLIENT_MESSAGES[code];
}
