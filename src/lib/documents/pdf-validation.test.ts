import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isPdfMagicBytes, validatePdfHeaderForUpload } from "./pdf-validation";

describe("pdf-validation", () => {
  it("accepts valid PDF magic bytes", () => {
    const header = Buffer.from("%PDF-1.7\n");
    assert.equal(validatePdfHeaderForUpload(header), true);
    assert.equal(isPdfMagicBytes(header), true);
  });

  it("rejects non-PDF content", () => {
    assert.equal(validatePdfHeaderForUpload(Buffer.from("NOTPDF")), false);
  });

  it("rejects extension spoof empty header", () => {
    assert.equal(validatePdfHeaderForUpload(new Uint8Array(2)), false);
  });
});
