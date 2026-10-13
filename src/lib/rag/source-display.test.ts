import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { groupSourcesForDisplay } from "./source-display";

describe("groupSourcesForDisplay", () => {
  it("merges PDF citations by document and sorts pages", () => {
    const grouped = groupSourcesForDisplay([
      {
        kind: "document",
        documentId: "d1",
        chunkId: "c4",
        title: "Patricia_Freelance_Web_Development_Guide",
        pageStart: 4,
        pageEnd: 4,
      },
      {
        kind: "document",
        documentId: "d2",
        chunkId: "c1",
        title: "ai-engineer",
        pageStart: 1,
        pageEnd: 1,
      },
      {
        kind: "document",
        documentId: "d1",
        chunkId: "c6",
        title: "Patricia_Freelance_Web_Development_Guide",
        pageStart: 6,
        pageEnd: 6,
      },
      {
        kind: "document",
        documentId: "d1",
        chunkId: "c12",
        title: "Patricia_Freelance_Web_Development_Guide",
        pageStart: 1,
        pageEnd: 2,
      },
      {
        kind: "note",
        noteId: "n1",
        title: "How To Become An AI Engineer In 2026",
        categoryName: null,
        type: "LINK",
      },
    ]);

    assert.equal(grouped.length, 3);
    assert.equal(grouped[0]?.type, "document");
    if (grouped[0]?.type === "document") {
      assert.equal(grouped[0].citations.length, 3);
      assert.deepEqual(
        grouped[0].citations.map((c) => c.pageStart),
        [1, 4, 6],
      );
    }
    assert.equal(grouped[2]?.type, "note");
  });
});
