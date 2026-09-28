import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { INGEST_URL_MAX_LENGTH } from "./types";
import { parseIngestUrlRequestBody } from "./ingest-validation";

describe("parseIngestUrlRequestBody", () => {
  it("accepts a valid url string", () => {
    const result = parseIngestUrlRequestBody({ url: "  https://example.com/a  " });
    assert.deepEqual(result, { success: true, url: "https://example.com/a" });
  });

  it("rejects non-object and missing url", () => {
    assert.equal(parseIngestUrlRequestBody(null).success, false);
    assert.equal(parseIngestUrlRequestBody({}).success, false);
    assert.equal(parseIngestUrlRequestBody({ url: 1 }).success, false);
  });

  it("rejects empty url after trim", () => {
    assert.equal(parseIngestUrlRequestBody({ url: "   " }).success, false);
  });

  it("rejects url over max length", () => {
    const url = `https://example.com/${"a".repeat(INGEST_URL_MAX_LENGTH)}`;
    assert.equal(parseIngestUrlRequestBody({ url }).success, false);
  });
});
