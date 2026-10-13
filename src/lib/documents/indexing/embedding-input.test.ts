import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildDocumentChunkEmbeddingInput,
  DOCUMENT_CHUNK_EMBED_MAX_CHARS,
} from "./embedding-input";

describe("buildDocumentChunkEmbeddingInput", () => {
  it("includes document title and chunk content", () => {
    const input = buildDocumentChunkEmbeddingInput("My Doc", "Chunk body");
    assert.match(input, /Document: My Doc/);
    assert.match(input, /Chunk body/);
  });

  it("rejects content over the provider limit", () => {
    assert.throws(() =>
      buildDocumentChunkEmbeddingInput("T", "x".repeat(DOCUMENT_CHUNK_EMBED_MAX_CHARS + 1)),
    );
  });
});
