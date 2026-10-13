import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildRetrievalQuery } from "./build-retrieval-query";
import {
  isValidRetrievalEmbeddingQuery,
  RETRIEVAL_EMBEDDING_QUERY_MAX_CHARS,
} from "./retrieval-query-limits";

describe("retrieval embedding query length", () => {
  it("allows contextual queries above the 500-char user question limit", () => {
    const history = Array.from({ length: 8 }, (_, index) => ({
      role: (index % 2 === 0 ? "user" : "assistant") as "user" | "assistant",
      content: `Turn ${index} `.padEnd(140, "x"),
    }));
    const query = buildRetrievalQuery("Follow up about my documents?", history);
    assert.ok(query.length > 500);
    assert.equal(isValidRetrievalEmbeddingQuery(query), true);
  });

  it("rejects queries over RETRIEVAL_EMBEDDING_QUERY_MAX_CHARS", () => {
    const tooLong = "x".repeat(RETRIEVAL_EMBEDDING_QUERY_MAX_CHARS + 1);
    assert.equal(isValidRetrievalEmbeddingQuery(tooLong), false);
  });
});
