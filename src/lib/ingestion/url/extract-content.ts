import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";

import {
  INGEST_EXTRACT_MIN_MEANINGFUL_CHARS,
  type ExtractContentExtractor,
  type ExtractContentInput,
  type ExtractContentPreview,
  type ExtractContentResult,
  type ExtractContentWarning,
  type FetchValidatedUrlSuccess,
} from "./types";
import {
  meaningfulCharacterCount,
  normalizeAndCapExtractedText,
  normalizeExtractedText,
} from "./normalize-content";

/**
 * Server-side extraction only — linkedom parses static markup and does not
 * run scripts, fetch subresources, or fire event handlers.
 */

const HTML_MIME_TYPES = new Set(["text/html", "application/xhtml+xml"]);

function primaryMime(contentType: string): string {
  return contentType.split(";")[0]?.trim().toLowerCase() ?? "";
}

function isPlainText(contentType: string): boolean {
  return primaryMime(contentType) === "text/plain";
}

function isHtml(contentType: string): boolean {
  return HTML_MIME_TYPES.has(primaryMime(contentType));
}

function pickTitle(
  readabilityTitle: string | null | undefined,
  documentTitle: string | null,
): { title: string | null; warnings: ExtractContentWarning[] } {
  const warnings: ExtractContentWarning[] = [];
  const readable = readabilityTitle?.trim();
  if (readable) {
    return { title: readable, warnings };
  }
  const docTitle = documentTitle?.trim();
  if (docTitle) {
    return { title: docTitle, warnings };
  }
  warnings.push("title_missing");
  return { title: null, warnings };
}

function domFallbackPlainText(document: Document): string {
  for (const selector of ["script", "style", "nav", "header", "footer", "noscript"]) {
    for (const node of document.querySelectorAll(selector)) {
      node.remove();
    }
  }
  const body = document.body;
  if (!body) {
    return "";
  }
  return body.textContent ?? "";
}

function buildPreview(
  input: ExtractContentInput,
  rawText: string,
  extractor: ExtractContentExtractor,
  title: string | null,
  titleWarnings: ExtractContentWarning[],
  extra?: { excerpt?: string; byline?: string },
): ExtractContentResult {
  const { text, warnings: capWarnings } = normalizeAndCapExtractedText(rawText);
  const warnings = [...titleWarnings, ...capWarnings];

  if (meaningfulCharacterCount(text) < INGEST_EXTRACT_MIN_MEANINGFUL_CHARS) {
    return { ok: false, code: "insufficient_content" };
  }

  const value: ExtractContentPreview = {
    originalUrl: input.originalUrl,
    finalUrl: input.finalUrl,
    title,
    content: text,
    contentLength: text.length,
    extractor,
    warnings,
    ...(extra?.excerpt ? { excerpt: extra.excerpt } : {}),
    ...(extra?.byline ? { byline: extra.byline } : {}),
  };

  return { ok: true, value };
}

function extractPlainText(input: ExtractContentInput): ExtractContentResult {
  const normalized = normalizeExtractedText(input.body);
  return buildPreview(input, normalized, "plain_text", null, []);
}

function extractHtml(input: ExtractContentInput): ExtractContentResult {
  let document: Document;
  try {
    ({ document } = parseHTML(input.body, { url: input.finalUrl }));
  } catch {
    return { ok: false, code: "extract_failed" };
  }

  if (!document.documentElement) {
    return { ok: false, code: "invalid_html" };
  }

  const docTitle =
    document.querySelector("title")?.textContent?.trim() || null;

  const reader = new Readability(document);
  const article = reader.parse();

  if (article?.textContent) {
    const trimmed = normalizeExtractedText(article.textContent);
    if (meaningfulCharacterCount(trimmed) >= INGEST_EXTRACT_MIN_MEANINGFUL_CHARS) {
      const { title, warnings } = pickTitle(article.title, docTitle);
      return buildPreview(input, trimmed, "readability", title, warnings, {
        excerpt: article.excerpt?.trim() || undefined,
        byline: article.byline?.trim() || undefined,
      });
    }
  }

  const fallbackRaw = domFallbackPlainText(document);
  const fallbackNormalized = normalizeExtractedText(fallbackRaw);
  if (meaningfulCharacterCount(fallbackNormalized) >= INGEST_EXTRACT_MIN_MEANINGFUL_CHARS) {
    const { title, warnings } = pickTitle(article?.title, docTitle);
    return buildPreview(input, fallbackNormalized, "dom_fallback", title, [
      ...warnings,
      "dom_fallback",
    ]);
  }

  return { ok: false, code: "insufficient_content" };
}

/**
 * Converts a successful Step 2 fetch into a normalized text preview for Step 4/API.
 */
export function extractContentFromFetch(
  fetchResult: FetchValidatedUrlSuccess["value"],
): ExtractContentResult {
  const input: ExtractContentInput = {
    originalUrl: fetchResult.originalUrl,
    finalUrl: fetchResult.finalUrl,
    contentType: fetchResult.contentType,
    body: fetchResult.body,
  };

  return extractContent(input);
}

export function extractContent(input: ExtractContentInput): ExtractContentResult {
  if (isPlainText(input.contentType)) {
    return extractPlainText(input);
  }

  if (isHtml(input.contentType)) {
    return extractHtml(input);
  }

  return { ok: false, code: "extract_failed" };
}
