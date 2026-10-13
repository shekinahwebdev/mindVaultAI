import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { runAskVaultPipeline } from "./ask-vault";
import type { RagSource } from "./types";

const noteSource: RagSource = {
  kind: "note",
  sourceNumber: 1,
  noteId: "n1",
  title: "Upload log",
  content: "Uploaded ai-engineer and Patricia guide",
  categoryName: null,
  type: "NOTE",
  similarity: 0.85,
};

describe("chat failure regression", () => {
  it("answers when retrieval and generation succeed (documents question path)", async () => {
    const result = await runAskVaultPipeline(
      {
        userId: "u1",
        question: "hey can you tell me about the documents i uploaded?",
      },
      {
        retrieve: async () => ({
          ok: true,
          sources: [noteSource],
          availability: {},
        }),
        answer: async () => ({
          ok: true,
          answer: {
            answer: "You uploaded guides about freelancing and AI engineering.",
            sourceNumbers: [1],
          },
          meta: { model: "gemini-3.5-flash-lite", latencyMs: 3 },
        }),
      },
    );

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.outcome, "answered");
    assert.match(result.answer, /uploaded/i);
  });
});
