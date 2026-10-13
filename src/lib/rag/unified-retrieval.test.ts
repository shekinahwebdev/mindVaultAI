import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { runAskVaultPipeline } from "./ask-vault";
import { buildRetrievalDisclaimer } from "./retrieval-disclaimer";
import type { RagSource } from "./types";

const noteSource: RagSource = {
  kind: "note",
  sourceNumber: 1,
  noteId: "n1",
  title: "Note",
  content: "note body",
  categoryName: null,
  type: "NOTE",
  similarity: 0.9,
};

describe("unified RAG degradation", () => {
  it("continues with notes when document search unavailable", async () => {
    const result = await runAskVaultPipeline(
      { userId: "u1", question: "What do my notes say?" },
      {
        retrieve: async () => ({
          ok: true,
          sources: [noteSource],
          availability: { documentSearchUnavailable: true },
        }),
        answer: async (input) => {
          assert.match(input.retrievalDisclaimer ?? "", /PDF document search was unavailable/);
          return {
            ok: true,
            answer: { answer: "From notes.", sourceNumbers: [1] },
            meta: { model: "test", latencyMs: 1 },
          };
        },
      },
    );

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.sources[0]?.kind, "note");
  });

  it("builds disclaimer for partial retrieval", () => {
    const text = buildRetrievalDisclaimer({ documentSearchUnavailable: true });
    assert.match(text ?? "", /PDF document search was unavailable/);
  });
});

describe("buildRagContext document blocks", () => {
  it("includes page numbers for PDF sources", async () => {
    const { buildRagContext } = await import("./build-context");
    const text = buildRagContext([
      {
        kind: "document",
        sourceNumber: 1,
        documentId: "d1",
        chunkId: "c1",
        title: "Textbook",
        content: "chapter",
        pageStart: 14,
        pageEnd: 14,
        similarity: 0.8,
      },
    ]);
    assert.match(text, /Page 14/);
    assert.match(text, /vault PDF excerpt/);
  });
});
