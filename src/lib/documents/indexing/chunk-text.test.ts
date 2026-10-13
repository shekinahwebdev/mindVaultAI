import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { DEFAULT_CHUNKING_CONFIG } from "./chunk-config";
import { chunkNormalizedPages } from "./chunk-text";

describe("chunkNormalizedPages", () => {
  it("is deterministic for identical input", () => {
    const pages = [
      { pageNumber: 1, text: "Alpha paragraph one.\n\nBeta paragraph two." },
      { pageNumber: 2, text: "Gamma on page two." },
    ];
    const a = chunkNormalizedPages(pages, DEFAULT_CHUNKING_CONFIG);
    const b = chunkNormalizedPages(pages, DEFAULT_CHUNKING_CONFIG);
    assert.deepEqual(a, b);
  });

  it("preserves page ranges and avoids empty chunks", () => {
    const pages = [{ pageNumber: 1, text: "Hello world." }];
    const chunks = chunkNormalizedPages(pages, DEFAULT_CHUNKING_CONFIG);
    assert.ok(chunks.length >= 1);
    for (const chunk of chunks) {
      assert.ok(chunk.content.length > 0);
      assert.ok(chunk.pageStart >= 1);
      assert.ok(chunk.pageEnd >= chunk.pageStart);
    }
  });

  it("splits long text into multiple chunks with overlap configuration", () => {
    const long = "Word ".repeat(800).trim();
    const pages = [{ pageNumber: 1, text: long }];
    const config = {
      targetChars: 400,
      maxChars: 500,
      overlapChars: 50,
    };
    const chunks = chunkNormalizedPages(pages, config);
    assert.ok(chunks.length > 1);
    assert.equal(chunks[0]!.chunkIndex, 0);
    assert.equal(chunks[chunks.length - 1]!.chunkIndex, chunks.length - 1);
  });
});
