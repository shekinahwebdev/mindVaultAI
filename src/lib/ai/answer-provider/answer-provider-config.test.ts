import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import {
  getAnswerProviderId,
  getConfiguredAnswerModel,
  OPENAI_ANSWER_MODEL,
} from "./config";
import { GEMINI_CHAT_GENERATION_MODEL } from "@/lib/ai/gemini-chat-models";

describe("answer provider config", () => {
  const priorProvider = process.env.AI_ANSWER_PROVIDER;
  const priorOpenAiModel = process.env.OPENAI_ANSWER_MODEL;

  afterEach(() => {
    if (priorProvider === undefined) {
      delete process.env.AI_ANSWER_PROVIDER;
    } else {
      process.env.AI_ANSWER_PROVIDER = priorProvider;
    }
    if (priorOpenAiModel === undefined) {
      delete process.env.OPENAI_ANSWER_MODEL;
    } else {
      process.env.OPENAI_ANSWER_MODEL = priorOpenAiModel;
    }
  });

  it("defaults to gemini when unset", () => {
    delete process.env.AI_ANSWER_PROVIDER;
    assert.equal(getAnswerProviderId(), "gemini");
    assert.equal(getConfiguredAnswerModel("gemini"), GEMINI_CHAT_GENERATION_MODEL);
  });

  it("selects openai when AI_ANSWER_PROVIDER=openai", () => {
    process.env.AI_ANSWER_PROVIDER = "openai";
    assert.equal(getAnswerProviderId(), "openai");
    assert.equal(getConfiguredAnswerModel("openai"), OPENAI_ANSWER_MODEL);
  });
});
