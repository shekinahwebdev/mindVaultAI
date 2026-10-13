import { CHARS_PER_TOKEN_ESTIMATE, type ChunkingConfig } from "./chunk-config";
import type { NormalizedPage } from "./normalize-text";

export type DocumentChunkDraft = {
  chunkIndex: number;
  content: string;
  pageStart: number;
  pageEnd: number;
  characterCount: number;
  tokenCount: number;
};

type PageSpan = {
  pageNumber: number;
  text: string;
};

function splitIntoParagraphs(pages: NormalizedPage[]): PageSpan[] {
  const spans: PageSpan[] = [];
  for (const page of pages) {
    if (!page.text) {
      continue;
    }
    const paragraphs = page.text.split(/\n\n+/);
    for (const paragraph of paragraphs) {
      const trimmed = paragraph.trim();
      if (trimmed) {
        spans.push({ pageNumber: page.pageNumber, text: trimmed });
      }
    }
  }
  return spans;
}

function splitLongSpan(span: PageSpan, maxChars: number): PageSpan[] {
  if (span.text.length <= maxChars) {
    return [span];
  }
  const sentences = span.text.split(/(?<=[.!?])\s+/);
  const out: PageSpan[] = [];
  let buffer = "";
  for (const sentence of sentences) {
    const candidate = buffer ? `${buffer} ${sentence}` : sentence;
    if (candidate.length <= maxChars) {
      buffer = candidate;
      continue;
    }
    if (buffer) {
      out.push({ pageNumber: span.pageNumber, text: buffer });
      buffer = sentence;
    } else {
      for (let i = 0; i < sentence.length; i += maxChars) {
        out.push({
          pageNumber: span.pageNumber,
          text: sentence.slice(i, i + maxChars),
        });
      }
      buffer = "";
    }
  }
  if (buffer) {
    out.push({ pageNumber: span.pageNumber, text: buffer });
  }
  return out;
}

function estimateTokens(charCount: number): number {
  return Math.max(1, Math.ceil(charCount / CHARS_PER_TOKEN_ESTIMATE));
}

/**
 * Deterministic, structure-aware chunking over normalized page text.
 */
export function chunkNormalizedPages(
  pages: NormalizedPage[],
  config: ChunkingConfig,
): DocumentChunkDraft[] {
  const spans = splitIntoParagraphs(pages).flatMap((span) =>
    splitLongSpan(span, config.maxChars),
  );

  if (spans.length === 0) {
    return [];
  }

  const chunks: DocumentChunkDraft[] = [];
  let currentParts: PageSpan[] = [];
  let currentLen = 0;

  const flush = () => {
    if (currentParts.length === 0) {
      return;
    }
    const content = currentParts.map((p) => p.text).join("\n\n");
    const pageStart = currentParts[0]!.pageNumber;
    const pageEnd = currentParts[currentParts.length - 1]!.pageNumber;
    const characterCount = content.length;
    chunks.push({
      chunkIndex: chunks.length,
      content,
      pageStart,
      pageEnd,
      characterCount,
      tokenCount: estimateTokens(characterCount),
    });
    currentParts = [];
    currentLen = 0;
  };

  const overlapTail = (parts: PageSpan[], overlapChars: number): PageSpan[] => {
    if (overlapChars <= 0 || parts.length === 0) {
      return [];
    }
    const tail: PageSpan[] = [];
    let len = 0;
    for (let i = parts.length - 1; i >= 0; i -= 1) {
      const part = parts[i]!;
      tail.unshift(part);
      len += part.text.length + 2;
      if (len >= overlapChars) {
        break;
      }
    }
    return tail;
  };

  for (const span of spans) {
    const addition = span.text.length + (currentParts.length > 0 ? 2 : 0);
    if (currentLen + addition > config.targetChars && currentParts.length > 0) {
      const tail = overlapTail(currentParts, config.overlapChars);
      flush();
      currentParts = [...tail];
      currentLen = currentParts.reduce(
        (sum, p, idx) => sum + p.text.length + (idx > 0 ? 2 : 0),
        0,
      );
    }
    currentParts.push(span);
    currentLen += addition;
    if (currentLen >= config.maxChars) {
      flush();
    }
  }
  flush();

  return chunks.map((chunk, index) => ({ ...chunk, chunkIndex: index }));
}
