import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import OpenAI from "openai";

import { createOpenAIEmbedder } from "./embed-text-openai";

describe("embedTextOpenAI", () => {
  const env = { ...process.env };

  afterEach(() => {
    process.env = { ...env };
  });

  it("returns 768-dimensional vectors from OpenAI SDK", async () => {
    process.env.OPENAI_EMBEDDING_MODEL = "text-embedding-3-small";
    process.env.OPENAI_EMBEDDING_DIMENSIONS = "768";

    const vector = Array.from({ length: 768 }, (_, index) => index / 768);
    const embed = createOpenAIEmbedder({
      apiKey: "test-key",
      createClient: () => ({
        embeddings: {
          create: async () => ({
            data: [{ embedding: vector }],
          }),
        },
      }),
    });

    const result = await embed({ text: "hello", taskType: "query" });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.embedding.length, 768);
      assert.equal(result.meta.model, "text-embedding-3-small");
    }
  });

  it("maps 429 responses to rate_limit", async () => {
    const rateLimitError = new OpenAI.APIError(429, new Headers(), "rate limited", undefined);

    const embed = createOpenAIEmbedder({
      apiKey: "test-key",
      createClient: () => ({
        embeddings: {
          create: async () => {
            throw rateLimitError;
          },
        },
      }),
    });

    const result = await embed({ text: "hello", taskType: "query" });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "rate_limit");
    }
  });

  it("returns provider_error when API key is missing", async () => {
    const embed = createOpenAIEmbedder({ apiKey: "" });
    const result = await embed({ text: "hello", taskType: "query" });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "provider_error");
    }
  });
});
