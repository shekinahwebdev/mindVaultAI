import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { RagAnswerSchema } from "./schemas";

describe("RAG answer schema", () => {
  it("accepts answer with source numbers for citation validation", () => {
    const parsed = RagAnswerSchema.safeParse({
      answer: "See Source 1.",
      sourceNumbers: [1, 2],
    });
    assert.equal(parsed.success, true);
  });

  it("rejects missing sourceNumbers", () => {
    const parsed = RagAnswerSchema.safeParse({ answer: "Only text" });
    assert.equal(parsed.success, false);
  });
});
