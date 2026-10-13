import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ProcessingError } from "@/lib/documents/processing/job-errors";

import { extractPdfText } from "./pdf-extraction";
import {
  buildCorruptPdfBytes,
  buildEmptyContentPdf,
  buildMinimalTextPdf,
} from "./test-fixtures/pdf-bytes";

describe("extractPdfText", () => {
  it("extracts text and preserves page numbers", async () => {
    const bytes = buildMinimalTextPdf("Hello PDF");
    const result = await extractPdfText(bytes, {
      maxBytes: 1024 * 1024,
      maxPages: 10,
      maxDurationMs: 30_000,
    });
    assert.ok(result.pageCount >= 1);
    assert.ok(result.pages.some((p) => p.pageNumber === 1));
    const joined = result.pages.map((p) => p.text).join(" ");
    assert.match(joined, /Hello PDF/);
  });

  it("rejects corrupt PDFs", async () => {
    await assert.rejects(
      () =>
        extractPdfText(buildCorruptPdfBytes(), {
          maxBytes: 1024 * 1024,
          maxPages: 10,
          maxDurationMs: 5_000,
        }),
      ProcessingError,
    );
  });

  it("detects empty / image-only PDFs", async () => {
    await assert.rejects(
      () =>
        extractPdfText(buildEmptyContentPdf(), {
          maxBytes: 1024 * 1024,
          maxPages: 10,
          maxDurationMs: 5_000,
        }),
      ProcessingError,
    );
  });
});
