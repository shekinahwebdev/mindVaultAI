import assert from "node:assert/strict";
import { describe, it } from "node:test";

import OpenAI from "openai";

import { createOpenAiAnswerAdapter } from "./openai-adapter";
import { OPENAI_ANSWER_MODEL } from "./config";

const sampleSource = {
  kind: "note" as const,
  sourceNumber: 1,
  noteId: "n1",
  title: "Note",
  content: "Body",
  categoryName: null,
  type: "NOTE",
  similarity: 0.9,
};

describe("OpenAI answer adapter", () => {
  it("returns provider_error when API key is missing", async () => {
    const adapter = createOpenAiAnswerAdapter({
      apiKey: "",
      createClient: () => null,
    });

    const result = await adapter.generateRagAnswer({
      question: "What is in my vault?",
      sources: [sampleSource],
    });

    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.reason, "provider_error");
  });

  it("parses structured RAG JSON and returns source numbers", async () => {
    let callCount = 0;
    const adapter = createOpenAiAnswerAdapter({
      apiKey: "test-key",
      model: OPENAI_ANSWER_MODEL,
      createClient: () =>
        ({
          chat: {
            completions: {
              create: async () => {
                callCount += 1;
                return {
                  choices: [
                    {
                      message: {
                        content: JSON.stringify({
                          answer: "Your note says body.",
                          sourceNumbers: [1, 99],
                        }),
                      },
                    },
                  ],
                  usage: { prompt_tokens: 10, completion_tokens: 5 },
                };
              },
            },
          },
        }) as unknown as OpenAI,
    });

    const result = await adapter.generateRagAnswer({
      question: "Summarize",
      sources: [sampleSource],
    });

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.match(result.answer.answer, /note/i);
    assert.deepEqual(result.answer.sourceNumbers, [1, 99]);
    assert.equal(result.meta.model, OPENAI_ANSWER_MODEL);
    assert.equal(callCount, 1);
  });

  it("retries once on invalid JSON output", async () => {
    let callCount = 0;
    const adapter = createOpenAiAnswerAdapter({
      apiKey: "test-key",
      createClient: () =>
        ({
          chat: {
            completions: {
              create: async () => {
                callCount += 1;
                if (callCount === 1) {
                  return { choices: [{ message: { content: "not-json" } }] };
                }
                return {
                  choices: [
                    {
                      message: {
                        content: JSON.stringify({
                          answer: "Recovered.",
                          sourceNumbers: [],
                        }),
                      },
                    },
                  ],
                };
              },
            },
          },
        }) as unknown as OpenAI,
    });

    const result = await adapter.generateRagAnswer({
      question: "Q",
      sources: [sampleSource],
    });

    assert.equal(result.ok, true);
    assert.equal(callCount, 2);
  });

  it("maps rate limit errors", async () => {
    const adapter = createOpenAiAnswerAdapter({
      apiKey: "test-key",
      createClient: () =>
        ({
          chat: {
            completions: {
              create: async () => {
                throw new OpenAI.RateLimitError(429, undefined, "rate limited", new Headers());
              },
            },
          },
        }) as unknown as OpenAI,
    });

    const result = await adapter.generateRagAnswer({
      question: "Q",
      sources: [sampleSource],
    });

    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.reason, "rate_limit");
  });
});
