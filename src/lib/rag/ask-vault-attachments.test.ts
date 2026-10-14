import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { runAskVaultPipeline } from "./ask-vault";
import type { RagSource } from "./types";

const docSource: RagSource = {
  kind: "document",
  sourceNumber: 1,
  documentId: "doc-1",
  chunkId: "chunk-1",
  title: "ai-engineer",
  content: "AI engineering topics",
  pageStart: 2,
  pageEnd: 2,
  similarity: 0.91,
};

describe("document-scoped ask vault", () => {
  it("passes attachment retrieval options and skips unrelated vault PDFs", async () => {
    let retrieveOptions: unknown;
    const result = await runAskVaultPipeline(
      {
        userId: "u1",
        question: "Summarize the attached PDF",
        attachmentScope: {
          hasAttachments: true,
          readyDocumentIds: ["doc-1"],
          droppedDocumentIds: [],
          notReadyDocumentIds: [],
          attachedDocuments: [{ documentId: "doc-1", title: "ai-engineer" }],
          includeNotes: false,
        },
      },
      {
        retrieve: async (_userId, _query, options) => {
          retrieveOptions = options;
          return { ok: true, sources: [docSource], availability: {} };
        },
        answer: async () => ({
          ok: true,
          answer: { answer: "Summary.", sourceNumbers: [1] },
          meta: { model: "test", latencyMs: 1 },
        }),
      },
    );

    assert.equal(result.ok, true);
    assert.deepEqual(retrieveOptions, {
      documentIds: ["doc-1"],
      includeNotes: false,
      restrictToAttachedDocuments: true,
    });
  });
});
