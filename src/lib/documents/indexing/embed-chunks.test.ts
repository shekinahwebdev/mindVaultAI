import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { EMBEDDING_DIMENSIONS } from "@/lib/ai/embed-text";
import { ProcessingError } from "@/lib/documents/processing/job-errors";

import { embedDocumentChunks } from "./embed-chunks";

describe("embedDocumentChunks", () => {
  it("validates embedding dimensions", async () => {
    await assert.rejects(
      () =>
        embedDocumentChunks({
          documentTitle: "Doc",
          chunkIndexes: [0],
          readChunkContent: async () => "hello",
          writeEmbedding: async () => {},
          embed: async () => ({
            ok: true,
            embedding: new Array(100).fill(0.1),
            meta: { model: "m", dimensions: 100, latencyMs: 1 },
          }),
        }),
      ProcessingError,
    );
  });

  it("classifies rate limits as transient", async () => {
    await assert.rejects(
      () =>
        embedDocumentChunks({
          documentTitle: "Doc",
          chunkIndexes: [0],
          readChunkContent: async () => "hello",
          writeEmbedding: async () => {},
          embed: async () => ({
            ok: false,
            reason: "rate_limit",
            meta: { model: "m", dimensions: EMBEDDING_DIMENSIONS, latencyMs: 1 },
          }),
        }),
      (error: unknown) =>
        error instanceof ProcessingError && error.kind === "transient",
    );
  });
});
