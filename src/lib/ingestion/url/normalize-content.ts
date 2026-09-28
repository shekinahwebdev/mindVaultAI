import type { ExtractContentWarning } from "./types";

/** Aligned with note/analyze max content length across capture-validation and analyze-validation. */
export const INGEST_EXTRACT_MAX_CONTENT_CHARS = 100_000;

const CONTROL_CHAR_PATTERN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/**
 * Deterministic text cleanup after extraction — not summarization or rewriting.
 */
export function normalizeExtractedText(input: string): string {
  let text = input.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  text = text.replace(CONTROL_CHAR_PATTERN, "");
  text = text.trim();
  text = text.replace(/\n{3,}/g, "\n\n");
  return text.trim();
}

export type NormalizeWithCapResult = {
  text: string;
  warnings: ExtractContentWarning[];
};

export function normalizeAndCapExtractedText(
  input: string,
  maxChars: number = INGEST_EXTRACT_MAX_CONTENT_CHARS,
): NormalizeWithCapResult {
  const normalized = normalizeExtractedText(input);
  if (normalized.length <= maxChars) {
    return { text: normalized, warnings: [] };
  }
  return {
    text: normalized.slice(0, maxChars),
    warnings: ["truncated"],
  };
}

/** Non-whitespace length — used for minimum useful content threshold. */
export function meaningfulCharacterCount(text: string): number {
  return text.replace(/\s+/g, "").length;
}
