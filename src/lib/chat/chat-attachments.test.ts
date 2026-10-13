import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { normalizeAttachedDocumentIds } from "./chat-attachments";

describe("chat attachments", () => {
  it("normalizes and dedupes document ids with a cap", () => {
    const ids = normalizeAttachedDocumentIds([
      " a ",
      "b",
      "a",
      3,
      "",
      ...Array.from({ length: 10 }, (_, i) => `id-${i}`),
    ]);
    assert.equal(ids[0], "a");
    assert.equal(ids[1], "b");
    assert.ok(ids.length <= 8);
    assert.equal(ids.includes("a"), true);
  });
});
