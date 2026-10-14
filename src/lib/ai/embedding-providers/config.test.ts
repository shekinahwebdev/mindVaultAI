import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

describe("embedding provider config", () => {
  const env = { ...process.env };

  afterEach(() => {
    process.env = { ...env };
  });

  it("defaults write provider to gemini", async () => {
    delete process.env.EMBEDDING_PROVIDER;
    const { getEmbeddingWriteProvider } = await import("./config");
    assert.equal(getEmbeddingWriteProvider(), "gemini");
  });

  it("defaults retrieval provider to gemini when unset", async () => {
    delete process.env.EMBEDDING_RETRIEVAL_PROVIDER;
    delete process.env.EMBEDDING_PROVIDER;
    const { getEmbeddingRetrievalProvider } = await import("./config");
    assert.equal(getEmbeddingRetrievalProvider(), "gemini");
  });

  it("requires OPENAI_API_KEY for openai validation", async () => {
    delete process.env.OPENAI_API_KEY;
    const { validateEmbeddingEnvironment } = await import("./config");
    assert.match(validateEmbeddingEnvironment("openai") ?? "", /OPENAI_API_KEY/);
  });

  it("enforces 768 dimensions for openai storage", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    process.env.OPENAI_EMBEDDING_DIMENSIONS = "512";
    const { validateEmbeddingEnvironment } = await import("./config");
    assert.match(validateEmbeddingEnvironment("openai") ?? "", /768/);
  });
});
