import { isIP } from "node:net";

import {
  assertAllAddressesAllowed,
  isBlockedHostname,
  isBlockedIp,
  normalizeHostname,
} from "./is-blocked-host";
import {
  ALLOWED_INGEST_PROTOCOLS,
  INGEST_URL_MAX_LENGTH,
  type HostResolver,
  type ParseIngestUrlResult,
  type SafeIngestUrl,
  type UrlSafetyResult,
} from "./types";

export type ValidateIngestUrlOptions = {
  resolve?: HostResolver;
};

/**
 * Structural URL checks only (no DNS). Use validateIngestUrlSafety for full SSRF-oriented validation.
 */
export function parseIngestUrl(input: string): ParseIngestUrlResult {
  const trimmed = input.trim();

  if (!trimmed) {
    return { ok: false, code: "invalid_url" };
  }

  if (trimmed.length > INGEST_URL_MAX_LENGTH) {
    return { ok: false, code: "url_too_long" };
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return { ok: false, code: "invalid_url" };
  }

  if (!ALLOWED_INGEST_PROTOCOLS.has(url.protocol)) {
    return { ok: false, code: "unsupported_protocol" };
  }

  if (url.username || url.password) {
    return { ok: false, code: "credentials_not_allowed" };
  }

  if (!url.hostname) {
    return { ok: false, code: "invalid_url" };
  }

  const hostname = normalizeHostname(url.hostname);

  return {
    ok: true,
    value: {
      url,
      normalizedUrl: url.href,
      hostname,
    },
  };
}

/**
 * Full server-side validation: parse, hostname blocklist, IP literal checks, DNS resolution.
 * DNS resolution is part of validation but does not fetch HTTP content (Step 2).
 *
 * Limitation: a passing result does not guarantee a later fetch() connects to the same
 * addresses — Step 2 must pin connections or re-validate on redirect hops.
 */
export async function validateIngestUrlSafety(
  input: string,
  options?: ValidateIngestUrlOptions,
): Promise<UrlSafetyResult> {
  const parsed = parseIngestUrl(input);
  if (!parsed.ok) {
    return parsed;
  }

  const { hostname } = parsed.value;

  if (isBlockedHostname(hostname)) {
    return { ok: false, code: "blocked_hostname" };
  }

  const literalKind = isIP(hostname);
  if (literalKind === 4 || literalKind === 6) {
    if (isBlockedIp(hostname)) {
      return { ok: false, code: "blocked_ip" };
    }

    const value: SafeIngestUrl = {
      ...parsed.value,
      resolvedAddresses: [hostname],
    };
    return { ok: true, value };
  }

  const { resolveHostAddresses } = await import("./resolve-host");
  const resolved = await resolveHostAddresses(hostname, options?.resolve);
  if (!resolved.ok) {
    return resolved;
  }

  const allowed = assertAllAddressesAllowed(resolved.addresses);
  if (!allowed.ok) {
    return allowed;
  }

  return {
    ok: true,
    value: {
      ...parsed.value,
      resolvedAddresses: resolved.addresses,
    },
  };
}
