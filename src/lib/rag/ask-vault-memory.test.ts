import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildGenerationContents, type AnswerQuestionInput } from "./answer-question";
import { runAskVaultPipeline } from "./ask-vault";
import type { RagSource } from "./types";

const sampleSources: RagSource[] = [
  {
    sourceNumber: 1,
    noteId: "note-1",
    title: "JWT",
    content: "JWT bearer tokens",
    categoryName: "Security",
    type: "NOTE",
    similarity: 0.9,
  },
];

describe("runAskVaultPipeline conversation memory", () => {
  it("passes bounded history and contextual retrieval query to dependencies", async () => {
    let capturedRetrievalQuery = "";
    const captured: { answerInput?: AnswerQuestionInput } = {};

    const result = await runAskVaultPipeline(
      {
        userId: "user-1",
        question: "Compare that to sessions.",
        conversationHistory: [
          { role: "user", content: "What have I saved about JWT authentication?" },
          { role: "assistant", content: "You saved JWT notes." },
        ],
      },
      {
        retrieve: async (_userId, query) => {
          capturedRetrievalQuery = query;
          return { ok: true, sources: sampleSources };
        },
        answer: async (input) => {
          captured.answerInput = input;
          return {
            ok: true,
            answer: { answer: "Comparison answer", sourceNumbers: [1] },
            meta: { model: "test", latencyMs: 1 },
          };
        },
      },
    );

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.outcome, "answered");
    }
    assert.match(capturedRetrievalQuery, /JWT authentication/);
    assert.match(capturedRetrievalQuery, /Compare that to sessions/);
    assert.ok(captured.answerInput);
    assert.equal(captured.answerInput.question, "Compare that to sessions.");
    assert.equal(captured.answerInput.conversationHistory?.length, 2);
  });

  it("behaves like single-turn RAG when history is empty", async () => {
    let capturedRetrievalQuery = "";

    await runAskVaultPipeline(
      {
        userId: "user-1",
        question: "What have I saved about JWT?",
        conversationHistory: [],
      },
      {
        retrieve: async (_userId, query) => {
          capturedRetrievalQuery = query;
          return { ok: true, sources: sampleSources };
        },
        answer: async () => ({
          ok: true,
          answer: { answer: "JWT answer", sourceNumbers: [1] },
          meta: { model: "test", latencyMs: 1 },
        }),
      },
    );

    assert.equal(capturedRetrievalQuery, "What have I saved about JWT?");
  });
});

describe("buildGenerationContents", () => {
  it("preserves user/model roles and ends with current sources + question", () => {
    const contents = buildGenerationContents(
      "Explain it more simply.",
      sampleSources,
      [
        { role: "user", content: "Explain dependency injection from my notes." },
        { role: "assistant", content: "Your notes describe constructor injection." },
      ],
    );

    assert.equal(contents.length, 3);
    assert.equal(contents[0]?.role, "user");
    assert.equal(contents[1]?.role, "model");
    assert.match(String(contents[2]?.parts?.[0]?.text), /CURRENT VAULT SOURCES/);
    assert.match(String(contents[2]?.parts?.[0]?.text), /Explain it more simply/);
  });
});
