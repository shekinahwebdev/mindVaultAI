import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

import { EMBEDDING_MODEL } from "./embed-text";

describe("Gemini embeddings unchanged", () => {
  it("still uses gemini-embedding-001 for note and query vectors", () => {
    assert.equal(EMBEDDING_MODEL, "gemini-embedding-001");
    const source = readFileSync(join(process.cwd(), "src/lib/ai/embed-text.ts"), "utf8");
    assert.match(source, /GEMINI_API_KEY/);
    assert.equal(source.includes("OPENAI_API_KEY"), false);
  });
});
