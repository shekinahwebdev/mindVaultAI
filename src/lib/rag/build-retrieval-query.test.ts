import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildRetrievalQuery } from "./build-retrieval-query";

describe("buildRetrievalQuery", () => {
  it("returns the raw question when there is no history", () => {
    assert.equal(buildRetrievalQuery("What about AWS S3?", []), "What about AWS S3?");
  });

  it("includes prior turns and the current question for embedding search", () => {
    const query = buildRetrievalQuery("Compare that to sessions.", [
      { role: "user", content: "What have I saved about JWT authentication?" },
      { role: "assistant", content: "You saved notes on JWT bearer tokens." },
    ]);

    assert.match(query, /JWT authentication/);
    assert.match(query, /Compare that to sessions/);
    assert.match(query, /Current question:/);
  });

  it("includes a new topic without dropping the current question", () => {
    const query = buildRetrievalQuery("What have I saved about AWS S3?", [
      { role: "user", content: "What have I saved about JWT?" },
      { role: "assistant", content: "JWT notes..." },
    ]);

    assert.match(query, /AWS S3/);
    assert.match(query, /JWT/);
  });
});
