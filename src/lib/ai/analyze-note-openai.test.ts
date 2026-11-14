import assert from "node:assert/strict";
import { describe, it } from "node:test";

import OpenAI from "openai";

import { createOpenAiNoteAnalyzer } from "./analyze-note-openai";

const samplePayload = {
  title: "OAuth refresh tokens",
  type: "NOTE",
  category: "Work",
  tags: { existing: ["Backend"], suggested: ["Security"] },
};

describe("analyzeNote OpenAI", () => {
  it("returns parsed suggestion from structured JSON", async () => {
    const analyze = createOpenAiNoteAnalyzer({
      apiKey: "test-key",
      model: "gpt-4o-mini",
      createClient: () => ({
        chat: {
          completions: {
            create: async () => ({
              choices: [{ message: { content: JSON.stringify(samplePayload) } }],
              usage: { prompt_tokens: 100, completion_tokens: 40 },
            }),
          },
        },
      }),
    });

    const result = await analyze({
      content: "Notes about OAuth2 refresh token rotation.",
      categoryNames: ["Work", "Personal"],
      tagNames: ["Backend"],
    });

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.suggestion.title, samplePayload.title);
    assert.equal(result.meta.model, "gpt-4o-mini");
    assert.equal(result.meta.inputTokens, 100);
  });

  it("maps 429 to rate_limit", async () => {
    const analyze = createOpenAiNoteAnalyzer({
      apiKey: "test-key",
      createClient: () => ({
        chat: {
          completions: {
            create: async () => {
              throw new OpenAI.APIError(429, new Headers(), "rate limited", undefined);
            },
          },
        },
      }),
    });

    const result = await analyze({
      content: "hello",
      categoryNames: [],
      tagNames: [],
    });

    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.reason, "rate_limit");
  });

  it("returns provider_error when API key is missing", async () => {
    const analyze = createOpenAiNoteAnalyzer({ apiKey: "" });
    const result = await analyze({
      content: "hello",
      categoryNames: [],
      tagNames: [],
    });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.reason, "provider_error");
  });
});
