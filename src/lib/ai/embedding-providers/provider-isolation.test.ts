import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

describe("embedding provider isolation", () => {
  it("note search uses separate gemini and openai columns", () => {
    const source = readFileSync(
      join(process.cwd(), "src/lib/notes/embedding-repository.ts"),
      "utf8",
    );
    assert.match(source, /openai_embedding/);
    assert.match(source, /ne\.embedding <=>/);
    assert.match(source, /retrievalProvider === "openai"/);
  });

  it("document chunk search uses separate gemini and openai columns", () => {
    const source = readFileSync(
      join(process.cwd(), "src/lib/documents/document-chunk-search.ts"),
      "utf8",
    );
    assert.match(source, /dc\.openai_embedding/);
    assert.match(source, /dc\.embedding <=>/);
  });

  it("retrieval queries use embedTextForRetrieval", () => {
    const search = readFileSync(
      join(process.cwd(), "src/lib/search/search-repository.ts"),
      "utf8",
    );
    const rag = readFileSync(join(process.cwd(), "src/lib/rag/retrieve-context.ts"), "utf8");
    assert.match(search, /embedTextForRetrieval/);
    assert.match(rag, /embedTextForRetrieval/);
  });
});
