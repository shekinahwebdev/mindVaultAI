import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CHAT_NO_RELEVANT_KNOWLEDGE_ANSWER,
  CHAT_PROVIDER_FAILURE_MESSAGE,
} from "@/lib/chat/chat-outcomes";

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

describe("askVault outcomes", () => {
  it("returns no_relevant_knowledge without calling Gemini", async () => {
    let answerCalled = false;

    const result = await runAskVaultPipeline(
      { userId: "user-1", question: "What is your name?" },
      {
        retrieve: async () => ({ ok: true, sources: [] }),
        answer: async () => {
          answerCalled = true;
          throw new Error("should not run");
        },
      },
    );

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.outcome, "no_relevant_knowledge");
    assert.equal(result.answer, CHAT_NO_RELEVANT_KNOWLEDGE_ANSWER);
    assert.deepEqual(result.sources, []);
    assert.equal(answerCalled, false);
  });

  it("returns provider_failure when generation fails", async () => {
    const result = await runAskVaultPipeline(
      { userId: "user-1", question: "What have I saved about JWT?" },
      {
        retrieve: async () => ({ ok: true, sources: sampleSources }),
        answer: async () => ({
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

  it("returns answered when sources exist and generation succeeds", async () => {
    const result = await runAskVaultPipeline(
      { userId: "user-1", question: "What have I saved about JWT?" },
      {
        retrieve: async () => ({ ok: true, sources: sampleSources }),
        answer: async () => ({
          ok: true,
          answer: { answer: "JWT notes.", sourceNumbers: [1] },
          meta: { model: "test", latencyMs: 1 },
        }),
      },
    );

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.outcome, "answered");
    assert.equal(result.sources.length, 1);
  });
});

describe("chat outcome copy", () => {
  it("does not use vault-safe wording for provider failures", () => {
    assert.equal(
      CHAT_PROVIDER_FAILURE_MESSAGE.includes("Your saved knowledge is still safe"),
      false,
    );
  });
});
