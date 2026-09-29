import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CHAT_NO_RELEVANT_KNOWLEDGE_ANSWER,
} from "@/lib/chat/chat-outcomes";
import type { DirectGroundedTurn } from "@/lib/chat/grounded-turn";

import { runAskVaultPipeline } from "./ask-vault";

const groundedTurn: DirectGroundedTurn = {
  assistantMessageId: "asst-jwt",
  userQuestion: "What did I save about JWT authentication?",
  assistantAnswer: "Your notes describe JWT bearer tokens for stateless auth.",
  sources: [
    {
      noteId: "note-jwt",
      title: "JWT",
      categoryName: "Security",
      type: "NOTE",
    },
  ],
};

describe("askVault grounded history fallback", () => {
  it("uses fallback when retrieval is empty and question is a follow-up", async () => {
    let ragAnswerCalled = false;
    let fallbackCalled = false;

    const result = await runAskVaultPipeline(
      {
        userId: "user-1",
        question: "Explain that more simply.",
        recentDirectGroundedTurn: groundedTurn,
      },
      {
        retrieve: async () => ({ ok: true, sources: [] }),
        answer: async () => {
          ragAnswerCalled = true;
          throw new Error("RAG should not run");
        },
        answerFromGroundedHistory: async (input) => {
          fallbackCalled = true;
          assert.equal(input.priorUserQuestion, groundedTurn.userQuestion);
          assert.equal(input.currentQuestion, "Explain that more simply.");
          return {
            ok: true,
            answer: "JWT is a token format for auth without server sessions.",
            meta: { model: "test", latencyMs: 1 },
          };
        },
      },
    );

    assert.equal(ragAnswerCalled, false);
    assert.equal(fallbackCalled, true);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.outcome, "answered_from_grounded_history");
    assert.equal(result.groundedFromMessageId, "asst-jwt");
    assert.deepEqual(result.sources, groundedTurn.sources);
  });

  it("returns no_relevant_knowledge for unrelated questions without calling fallback", async () => {
    let fallbackCalled = false;

    const result = await runAskVaultPipeline(
      {
        userId: "user-1",
        question: "Who invented Python?",
        recentDirectGroundedTurn: groundedTurn,
      },
      {
        retrieve: async () => ({ ok: true, sources: [] }),
        answer: async () => ({ ok: true, answer: { answer: "x", sourceNumbers: [1] }, meta: { model: "t", latencyMs: 1 } }),
        answerFromGroundedHistory: async () => {
          fallbackCalled = true;
          throw new Error("should not run");
        },
      },
    );

    assert.equal(fallbackCalled, false);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.outcome, "no_relevant_knowledge");
    assert.equal(result.answer, CHAT_NO_RELEVANT_KNOWLEDGE_ANSWER);
  });

  it("returns no_relevant_knowledge when follow-up has no direct grounded turn", async () => {
    let fallbackCalled = false;

    const result = await runAskVaultPipeline(
      {
        userId: "user-1",
        question: "Explain that more simply.",
        recentDirectGroundedTurn: null,
      },
      {
        retrieve: async () => ({ ok: true, sources: [] }),
        answerFromGroundedHistory: async () => {
          fallbackCalled = true;
          throw new Error("should not run");
        },
      },
    );

    assert.equal(fallbackCalled, false);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.outcome, "no_relevant_knowledge");
  });

  it("prefers fresh RAG when retrieval finds sources", async () => {
    let fallbackCalled = false;

    const result = await runAskVaultPipeline(
      {
        userId: "user-1",
        question: "Explain that more simply.",
        recentDirectGroundedTurn: groundedTurn,
      },
      {
        retrieve: async () => ({
          ok: true,
          sources: [
            {
              sourceNumber: 1,
              noteId: "note-jwt",
              title: "JWT",
              content: "fresh",
              categoryName: null,
              type: "NOTE",
              similarity: 0.9,
            },
          ],
        }),
        answer: async () => ({
          ok: true,
          answer: { answer: "From vault.", sourceNumbers: [1] },
          meta: { model: "test", latencyMs: 1 },
        }),
        answerFromGroundedHistory: async () => {
          fallbackCalled = true;
          throw new Error("should not run");
        },
      },
    );

    assert.equal(fallbackCalled, false);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.outcome, "answered");
  });

  it("returns provider_failure when fallback generation fails", async () => {
    const result = await runAskVaultPipeline(
      {
        userId: "user-1",
        question: "Summarize that in 3 bullets.",
        recentDirectGroundedTurn: groundedTurn,
      },
      {
        retrieve: async () => ({ ok: true, sources: [] }),
        answerFromGroundedHistory: async () => ({
          ok: false,
          reason: "provider_error",
          meta: { model: "test", latencyMs: 1 },
        }),
      },
    );

    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.reason, "provider_failure");
  });
});
