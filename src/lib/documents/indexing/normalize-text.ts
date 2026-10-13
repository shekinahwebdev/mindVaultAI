import type { ExtractedPdfPage } from "./pdf-extraction";

export type NormalizedPage = {
  pageNumber: number;
  text: string;
};

/**
 * Deterministic cleanup of PDF extraction output. Preserves meaningful punctuation
 * and does not strip unicode content.
 */
export function normalizePageText(raw: string): string {
  let text = raw.replace(/\u0000/g, "");
  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  text = text.replace(/[\t\f\v]+/g, " ");
  text = text.replace(/ +/g, " ");
  text = text.replace(/\n{3,}/g, "\n\n");
  return text.trim();
}

export function normalizeExtractedPages(pages: ExtractedPdfPage[]): NormalizedPage[] {
  return pages.map((page) => ({
    pageNumber: page.pageNumber,
    text: normalizePageText(page.text),
  }));
}
