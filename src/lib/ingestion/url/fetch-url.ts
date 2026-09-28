import { isIP } from "node:net";

import { Agent, fetch as undiciFetch } from "undici";
import type { Dispatcher } from "undici";

import {
  INGEST_FETCH_MAX_BODY_BYTES,
  INGEST_FETCH_MAX_REDIRECTS,
  INGEST_FETCH_TIMEOUT_MS,
  type FetchErrorCode,
  type FetchValidatedUrlResult,
  type HostResolver,
} from "./types";
import { validateIngestUrlSafety } from "./validate-url";

/**
 * Server-only HTTP fetch for URL ingestion. Uses undici with a pinned lookup so
 * the TCP connection targets an address already validated by Step 1 — not a
 * fresh resolver lookup at connect time.
 */

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

const ALLOWED_MIME_TYPES = new Set([
  "text/html",
  "application/xhtml+xml",
  "text/plain",
]);

const REJECTED_MIME_PREFIXES = ["image/", "video/", "audio/"] as const;

const REJECTED_MIME_TYPES = new Set([
  "application/octet-stream",
  "application/pdf",
]);

const FETCH_HEADERS = {
  "user-agent": "MindVault-URL-Ingest/1.0",
  accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.1",
  "accept-encoding": "gzip, deflate, br",
} as const;

export type PinnedFetchContext = {
  url: URL;
  hostname: string;
  pinnedAddress: string;
  signal: AbortSignal;
};

/** Minimal response shape shared by undici and test doubles. */
export type FetchLikeResponse = {
  status: number;
  headers: {
    get(name: string): string | null;
  };
  body: ReadableStream<Uint8Array> | null;
};

/** Injectable transport for tests; production uses undici + pinned Agent. */
export type PinnedFetchFn = (context: PinnedFetchContext) => Promise<FetchLikeResponse>;

export type FetchValidatedUrlOptions = {
  resolve?: HostResolver;
  maxRedirects?: number;
  maxBodyBytes?: number;
  timeoutMs?: number;
  pinnedFetch?: PinnedFetchFn;
};

export function createPinnedDispatcher(
  hostname: string,
  pinnedAddress: string,
): Dispatcher {
  const family = isIP(pinnedAddress) === 6 ? 6 : 4;
  return new Agent({
    connect: {
      servername: hostname,
      lookup(_hostname, _options, callback) {
        callback(null, pinnedAddress, family);
      },
    },
  });
}

export const defaultPinnedFetch: PinnedFetchFn = async ({
  url,
  hostname,
  pinnedAddress,
  signal,
}) => {
  const dispatcher = createPinnedDispatcher(hostname, pinnedAddress);
  try {
    const response = await undiciFetch(url.href, {
      method: "GET",
      redirect: "manual",
      headers: FETCH_HEADERS,
      signal,
      dispatcher,
    });
    return response as unknown as FetchLikeResponse;
  } finally {
    await dispatcher.close();
  }
};

function normalizeMimeType(contentType: string | null): string | null {
  if (!contentType) {
    return null;
  }
  const primary = contentType.split(";")[0]?.trim().toLowerCase();
  return primary || null;
}

export function classifyContentType(contentType: string | null): FetchErrorCode | null {
  const mime = normalizeMimeType(contentType);
  if (!mime) {
    return "unsupported_content";
  }
  if (ALLOWED_MIME_TYPES.has(mime)) {
    return null;
  }
  if (REJECTED_MIME_TYPES.has(mime)) {
    return "unsupported_content";
  }
  for (const prefix of REJECTED_MIME_PREFIXES) {
    if (mime.startsWith(prefix)) {
      return "unsupported_content";
    }
  }
  return "unsupported_content";
}

const BINARY_SIGNATURES: Array<{ offset: number; bytes: number[] }> = [
  { offset: 0, bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  { offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47] }, // PNG
];

export function looksLikeBinaryBody(buffer: Uint8Array): boolean {
  if (buffer.length === 0) {
    return false;
  }
  const sample = buffer.subarray(0, Math.min(buffer.length, 512));
  let nullCount = 0;
  for (const byte of sample) {
    if (byte === 0) {
      nullCount += 1;
    }
  }
  if (nullCount > 0) {
    return true;
  }
  for (const sig of BINARY_SIGNATURES) {
    if (sample.length < sig.bytes.length) {
      continue;
    }
    if (sig.bytes.every((byte, index) => sample[sig.offset + index] === byte)) {
      return true;
    }
  }
  return false;
}

async function drainResponseBody(response: FetchLikeResponse): Promise<void> {
  try {
    await response.body?.cancel();
  } catch {
    // Best-effort drain for redirect responses.
  }
}

/**
 * Reads the response body stream with a byte cap. undici/fetch decompresses
 * gzip/br/deflate before exposing the body stream, so byte counts here apply
 * to decompressed data (the bytes we would parse in Step 3).
 */
export async function readBodyWithByteLimit(
  response: FetchLikeResponse,
  maxBytes: number,
): Promise<
  | { ok: true; bytes: Uint8Array; byteLength: number }
  | { ok: false; code: "too_large" }
> {
  const contentLengthHeader = response.headers.get("content-length");
  if (contentLengthHeader) {
    const contentLength = Number.parseInt(contentLengthHeader, 10);
    if (Number.isFinite(contentLength) && contentLength > maxBytes) {
      await drainResponseBody(response);
      return { ok: false, code: "too_large" };
    }
  }

  if (!response.body) {
    return { ok: true, bytes: new Uint8Array(), byteLength: 0 };
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      if (!value) {
        continue;
      }
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return { ok: false, code: "too_large" };
      }
      chunks.push(value);
    }
  } catch {
    await reader.cancel().catch(() => undefined);
    throw new Error("body_read_failed");
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return { ok: true, bytes, byteLength: total };
}

function isRedirectStatus(status: number): boolean {
  return REDIRECT_STATUSES.has(status);
}

function resolveRedirectUrl(location: string, baseUrl: string): URL | null {
  try {
    return new URL(location, baseUrl);
  } catch {
    return null;
  }
}

function isConnectionRetryable(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  const code = (error as NodeJS.ErrnoException).code;
  return (
    code === "ECONNREFUSED" ||
    code === "ECONNRESET" ||
    code === "ETIMEDOUT" ||
    code === "EHOSTUNREACH" ||
    code === "ENETUNREACH"
  );
}

async function fetchWithPinnedAddresses(
  safe: { url: URL; hostname: string; normalizedUrl: string; resolvedAddresses: string[] },
  pinnedFetch: PinnedFetchFn,
  signal: AbortSignal,
): Promise<FetchLikeResponse> {
  let lastError: unknown;
  for (const pinnedAddress of safe.resolvedAddresses) {
    try {
      return await pinnedFetch({
        url: safe.url,
        hostname: safe.hostname,
        pinnedAddress,
        signal,
      });
    } catch (error) {
      lastError = error;
      if (signal.aborted) {
        throw error;
      }
      if (isConnectionRetryable(error)) {
        continue;
      }
      throw error;
    }
  }
  throw lastError ?? new Error("fetch_failed");
}

function abortAfter(ms: number): { signal: AbortSignal; cancel: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return {
    signal: controller.signal,
    cancel: () => clearTimeout(timer),
  };
}

export async function fetchValidatedUrl(
  inputUrl: string,
  options?: FetchValidatedUrlOptions,
): Promise<FetchValidatedUrlResult> {
  const maxRedirects = options?.maxRedirects ?? INGEST_FETCH_MAX_REDIRECTS;
  const maxBodyBytes = options?.maxBodyBytes ?? INGEST_FETCH_MAX_BODY_BYTES;
  const timeoutMs = options?.timeoutMs ?? INGEST_FETCH_TIMEOUT_MS;
  const pinnedFetch = options?.pinnedFetch ?? defaultPinnedFetch;

  const originalUrl = inputUrl.trim();
  let currentUrl = originalUrl;
  let redirectCount = 0;
  const visited = new Set<string>();

  while (true) {
    const safety = await validateIngestUrlSafety(currentUrl, {
      resolve: options?.resolve,
    });
    if (!safety.ok) {
      return safety;
    }

    const visitKey = safety.value.normalizedUrl;
    if (visited.has(visitKey)) {
      return { ok: false, code: "redirect_loop" };
    }
    visited.add(visitKey);

    const hop = abortAfter(timeoutMs);
    let response: FetchLikeResponse;
    try {
      response = await fetchWithPinnedAddresses(safety.value, pinnedFetch, hop.signal);
    } catch (error) {
      hop.cancel();
      if (hop.signal.aborted || (error as { name?: string })?.name === "AbortError") {
        return { ok: false, code: "timeout" };
      }
      return { ok: false, code: "fetch_failed" };
    }
    hop.cancel();

    if (isRedirectStatus(response.status)) {
      await drainResponseBody(response);
      const location = response.headers.get("location");
      if (!location) {
        return { ok: false, code: "invalid_redirect", status: response.status };
      }
      const nextUrl = resolveRedirectUrl(location, safety.value.normalizedUrl);
      if (!nextUrl) {
        return { ok: false, code: "invalid_redirect", status: response.status };
      }
      redirectCount += 1;
      if (redirectCount > maxRedirects) {
        return { ok: false, code: "redirect_limit" };
      }
      currentUrl = nextUrl.href;
      continue;
    }

    if (response.status < 200 || response.status >= 300) {
      await drainResponseBody(response);
      return { ok: false, code: "fetch_failed", status: response.status };
    }

    const contentTypeHeader = response.headers.get("content-type");
    const contentTypeError = classifyContentType(contentTypeHeader);
    if (contentTypeError) {
      await drainResponseBody(response);
      return { ok: false, code: contentTypeError, status: response.status };
    }

    let bodyResult: Awaited<ReturnType<typeof readBodyWithByteLimit>>;
    try {
      bodyResult = await readBodyWithByteLimit(response, maxBodyBytes);
    } catch {
      return { ok: false, code: "fetch_failed", status: response.status };
    }

    if (!bodyResult.ok) {
      return { ok: false, code: bodyResult.code, status: response.status };
    }

    if (looksLikeBinaryBody(bodyResult.bytes)) {
      return { ok: false, code: "binary_content", status: response.status };
    }

    const body = new TextDecoder("utf-8", { fatal: false }).decode(bodyResult.bytes);
    const mime = normalizeMimeType(contentTypeHeader) ?? "text/plain";

    return {
      ok: true,
      value: {
        originalUrl: new URL(originalUrl).href,
        finalUrl: safety.value.normalizedUrl,
        status: response.status,
        contentType: mime,
        body,
        byteLength: bodyResult.byteLength,
        redirectCount,
      },
    };
  }
}
