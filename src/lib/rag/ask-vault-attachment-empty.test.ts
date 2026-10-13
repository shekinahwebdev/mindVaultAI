import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { runAskVaultPipeline } from "./ask-vault";

describe("attachment-scoped empty retrieval", () => {
  it("returns attachment-specific copy instead of vault-wide no knowledge", async () => {
    const result = await runAskVaultPipeline(
      {
        userId: "u1",
        question: "What does this PDF say about pricing?",
        attachmentScope: {
          hasAttachments: true,
          readyDocumentIds: ["doc-1"],
          droppedDocumentIds: [],
          notReadyDocumentIds: [],
          attachedDocuments: [{ documentId: "doc-1", title: "Guide" }],
          includeNotes: false,
        },
      },
      {
        retrieve: async () => ({ ok: true, sources: [], availability: {} }),
        answer: async () => {
          throw new Error("should not generate when scoped retrieval is empty");
        },
      },
    );

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.outcome, "no_relevant_knowledge");
    assert.match(result.answer, /attached PDFs/i);
    assert.equal(result.sources.length, 0);
  });
});
