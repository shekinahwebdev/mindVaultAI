import { ALLOWED_INGEST_PROTOCOLS } from "./types";

const YOUTUBE_HOST_SUFFIX = "youtube.com";
const YOUTUBE_SHORT_HOST = "youtu.be";

export type YouTubeOEmbedResponse = {
  title: string;
  author_name: string;
  author_url: string;
  thumbnail_url?: string;
};

export type YouTubeOEmbedPreview = {
  originalUrl: string;
  finalUrl: string;
  title: string;
  authorName: string;
  authorUrl: string;
  content: string;
  contentLength: number;
};

function normalizeHostname(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/\.$/, "");
}

/** Returns a canonical watch URL when input is a supported YouTube link. */
export function parseYouTubeIngestUrl(input: string): URL | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (!ALLOWED_INGEST_PROTOCOLS.has(parsed.protocol)) {
    return null;
  }

  const host = normalizeHostname(parsed.hostname);
  if (host === YOUTUBE_SHORT_HOST) {
    const videoId = parsed.pathname.replace(/^\//, "").split("/")[0];
    return videoId ? parsed : null;
  }

  if (host === YOUTUBE_HOST_SUFFIX || host.endsWith(`.${YOUTUBE_HOST_SUFFIX}`)) {
    if (parsed.pathname === "/watch" && parsed.searchParams.get("v")) {
      return parsed;
    }
    const shortsMatch = parsed.pathname.match(/^\/shorts\/([\w-]+)/);
    if (shortsMatch?.[1]) {
      return parsed;
    }
    const embedMatch = parsed.pathname.match(/^\/embed\/([\w-]+)/);
    if (embedMatch?.[1]) {
      return parsed;
    }
  }

  return null;
}

export function canonicalYouTubeWatchUrl(input: URL): string {
  const host = normalizeHostname(input.hostname);
  if (host === YOUTUBE_SHORT_HOST) {
    const videoId = input.pathname.replace(/^\//, "").split("/")[0];
    return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
  }

  const shortsMatch = input.pathname.match(/^\/shorts\/([\w-]+)/);
  if (shortsMatch?.[1]) {
    return `https://www.youtube.com/watch?v=${encodeURIComponent(shortsMatch[1])}`;
  }

  const embedMatch = input.pathname.match(/^\/embed\/([\w-]+)/);
  if (embedMatch?.[1]) {
    return `https://www.youtube.com/watch?v=${encodeURIComponent(embedMatch[1])}`;
  }

  const videoId = input.searchParams.get("v");
  if (videoId) {
    return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
  }

  return input.href;
}

export function buildYouTubeIngestContent(options: {
  title: string;
  authorName: string;
  watchUrl: string;
}): string {
  const lines = [
    options.title,
    "",
    `Channel: ${options.authorName}`,
    "",
    "Saved from YouTube. MindVault imports the title and link only — not the transcript or video file.",
    "",
    `Watch: ${options.watchUrl}`,
  ];
  return lines.join("\n").trim();
}

export type FetchYouTubeOEmbedOptions = {
  timeoutMs?: number;
  fetchFn?: typeof fetch;
};

export async function fetchYouTubeOEmbedPreview(
  inputUrl: string,
  options?: FetchYouTubeOEmbedOptions,
): Promise<
  | { ok: true; value: YouTubeOEmbedPreview }
  | { ok: false; code: "fetch_failed" }
> {
  const parsed = parseYouTubeIngestUrl(inputUrl);
  if (!parsed) {
    return { ok: false, code: "fetch_failed" };
  }

  const originalUrl = parsed.href;
  const finalUrl = canonicalYouTubeWatchUrl(parsed);
  const timeoutMs = options?.timeoutMs ?? 12_000;
  const fetchFn = options?.fetchFn ?? fetch;

  const oembedUrl = new URL("https://www.youtube.com/oembed");
  oembedUrl.searchParams.set("url", finalUrl);
  oembedUrl.searchParams.set("format", "json");

  let response: Response;
  try {
    response = await fetchFn(oembedUrl.href, {
      method: "GET",
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    return { ok: false, code: "fetch_failed" };
  }

  if (!response.ok) {
    return { ok: false, code: "fetch_failed" };
  }

  let payload: YouTubeOEmbedResponse;
  try {
    payload = (await response.json()) as YouTubeOEmbedResponse;
  } catch {
    return { ok: false, code: "fetch_failed" };
  }

  const title = payload.title?.trim();
  const authorName = payload.author_name?.trim();
  if (!title || !authorName) {
    return { ok: false, code: "fetch_failed" };
  }

  const content = buildYouTubeIngestContent({
    title,
    authorName,
    watchUrl: finalUrl,
  });

  return {
    ok: true,
    value: {
      originalUrl,
      finalUrl,
      title,
      authorName,
      authorUrl: payload.author_url ?? "",
      content,
      contentLength: content.length,
    },
  };
}
