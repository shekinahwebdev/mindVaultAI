import { createRequire } from "node:module";
import path from "node:path";

import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const require = createRequire(import.meta.url);
const pdfJsRoot = path.dirname(require.resolve("pdfjs-dist/package.json"));
const STANDARD_FONT_DATA_URL = `${pdfJsRoot}/standard_fonts/`;

import { DOCUMENT_MAX_SIZE_BYTES } from "@/lib/documents/config";
import { ProcessingError } from "@/lib/documents/processing/job-errors";
import { isPdfMagicBytes } from "@/lib/documents/pdf-validation";

export type PdfExtractionLimits = {
  maxBytes: number;
  maxPages: number;
  maxDurationMs: number;
};

export const DEFAULT_PDF_EXTRACTION_LIMITS: PdfExtractionLimits = {
  maxBytes: DOCUMENT_MAX_SIZE_BYTES,
  maxPages: 500,
  maxDurationMs: 90_000,
};

export type ExtractedPdfPage = {
  pageNumber: number;
  text: string;
};

export type PdfExtractionResult = {
  pages: ExtractedPdfPage[];
  pageCount: number;
};

export type PdfExtractionFailure =
  | "corrupt"
  | "encrypted"
  | "empty"
  | "image_only"
  | "too_large"
  | "too_many_pages"
  | "timeout";

function classifyPdfJsError(error: unknown): PdfExtractionFailure {
  const name = (error as { name?: string }).name;
  if (name === "PasswordException") {
    return "encrypted";
  }
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (message.includes("password") || message.includes("encrypt")) {
    return "encrypted";
  }
  return "corrupt";
}

function toProcessingError(reason: PdfExtractionFailure): ProcessingError {
  switch (reason) {
    case "encrypted":
      return new ProcessingError("PDF is password-protected.", "permanent");
    case "empty":
      return new ProcessingError("PDF contains no extractable text.", "permanent");
    case "image_only":
      return new ProcessingError("PDF appears to be image-only (OCR not supported).", "permanent");
    case "too_large":
      return new ProcessingError("PDF exceeds maximum allowed size.", "permanent");
    case "too_many_pages":
      return new ProcessingError("PDF exceeds maximum page count.", "permanent");
    case "timeout":
      return new ProcessingError("PDF text extraction timed out.", "transient");
    case "corrupt":
    default:
      return new ProcessingError("PDF could not be parsed.", "permanent");
  }
}

/**
 * Extract text per page from a text-based PDF buffer. Does not perform OCR.
 */
export async function extractPdfText(
  bytes: Uint8Array,
  limits: PdfExtractionLimits = DEFAULT_PDF_EXTRACTION_LIMITS,
): Promise<PdfExtractionResult> {
  if (bytes.length > limits.maxBytes) {
    throw toProcessingError("too_large");
  }
  if (!isPdfMagicBytes(bytes)) {
    throw toProcessingError("corrupt");
  }

  const started = Date.now();
  const deadline = started + limits.maxDurationMs;

  const data =
    bytes instanceof Uint8Array && !(bytes instanceof Buffer)
      ? bytes
      : new Uint8Array(bytes);

  let pdf;
  try {
    const task = getDocument({
      data,
      useSystemFonts: true,
      isEvalSupported: false,
      standardFontDataUrl: STANDARD_FONT_DATA_URL,
    });
    pdf = await task.promise;
  } catch (error) {
    throw toProcessingError(classifyPdfJsError(error));
  }

  if (pdf.numPages > limits.maxPages) {
    throw toProcessingError("too_many_pages");
  }

  const pages: ExtractedPdfPage[] = [];
  let nonWhitespaceChars = 0;

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    if (Date.now() > deadline) {
      throw toProcessingError("timeout");
    }

    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const parts: string[] = [];
    for (const item of textContent.items) {
      if ("str" in item && typeof item.str === "string") {
        parts.push(item.str);
        for (const ch of item.str) {
          if (!/\s/.test(ch)) {
            nonWhitespaceChars += 1;
          }
        }
      }
    }
    pages.push({
      pageNumber,
      text: parts.join(" "),
    });
  }

  if (nonWhitespaceChars === 0) {
    throw toProcessingError(pages.length > 0 ? "image_only" : "empty");
  }

  return { pages, pageCount: pdf.numPages };
}
