import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { getConfiguredAnswerModel } from "@/lib/ai/answer-provider/config";
import { GEMINI_CHAT_GENERATION_MODEL } from "@/lib/ai/gemini-chat-models";

describe("RAG generation model selection", () => {
  const prior = process.env.AI_ANSWER_PROVIDER;

  afterEach(() => {
    if (prior === undefined) {
      delete process.env.AI_ANSWER_PROVIDER;
    } else {
      process.env.AI_ANSWER_PROVIDER = prior;
    }
  });

  it("uses gemini lite by default for answer generation", () => {
    delete process.env.AI_ANSWER_PROVIDER;
    assert.equal(getConfiguredAnswerModel("gemini"), GEMINI_CHAT_GENERATION_MODEL);
    assert.equal(GEMINI_CHAT_GENERATION_MODEL, "gemini-3.5-flash-lite");
  });

  it("uses OpenAI model when AI_ANSWER_PROVIDER=openai", () => {
    process.env.AI_ANSWER_PROVIDER = "openai";
    assert.equal(getConfiguredAnswerModel("openai"), "gpt-4o-mini");
  });
});
