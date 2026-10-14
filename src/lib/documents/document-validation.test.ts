import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { DOCUMENT_MAX_SIZE_BYTES } from "./config";
import { parseInitiateUploadBody } from "./document-validation";

describe("parseInitiateUploadBody", () => {
  it("accepts valid PDF upload metadata", () => {
    const parsed = parseInitiateUploadBody({
      filename: "report.pdf",
      sizeBytes: 1024,
      mimeType: "application/pdf",
    });
    assert.equal(parsed.ok, true);
    if (parsed.ok) {
      assert.equal(parsed.filename, "report.pdf");
      assert.equal(parsed.sizeBytes, 1024);
    }
  });

  it("rejects invalid mime type", () => {
    const parsed = parseInitiateUploadBody({
      filename: "report.pdf",
      sizeBytes: 1024,
      mimeType: "text/plain",
    });
    assert.equal(parsed.ok, false);
  });

  it("rejects oversized files", () => {
    const parsed = parseInitiateUploadBody({
      filename: "big.pdf",
      sizeBytes: DOCUMENT_MAX_SIZE_BYTES + 1,
      mimeType: "application/pdf",
    });
    assert.equal(parsed.ok, false);
  });

  it("rejects non-pdf extension", () => {
    const parsed = parseInitiateUploadBody({
      filename: "notes.txt",
      sizeBytes: 10,
      mimeType: "application/pdf",
    });
    assert.equal(parsed.ok, false);
  });
});
