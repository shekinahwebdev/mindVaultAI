import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  RAG_MAX_CHUNKS_PER_DOCUMENT,
  RAG_MIN_SIMILARITY,
  selectMixedEvidence,
} from "./select-evidence";

describe("selectMixedEvidence", () => {
  it("merges notes and documents by similarity with renumbered sources", () => {
    const sources = selectMixedEvidence({
      noteMatches: [
        {
          similarity: 0.7,
          note: {
            id: "n1",
            title: "Note A",
            content: "alpha",
            type: "NOTE",
            sourceUrl: null,
            categoryId: null,
            category: null,
            createdAt: "",
            updatedAt: "",
            archivedAt: null,
            tags: [],
          },
        },
      ],
      documentMatches: [
        {
          chunkId: "c1",
          documentId: "d1",
          documentTitle: "PDF B",
          content: "beta",
          pageStart: 2,
          pageEnd: 2,
          chunkIndex: 0,
          similarity: 0.85,
        },
      ],
    });

    assert.equal(sources.length, 2);
    assert.equal(sources[0]!.kind, "document");
    assert.equal(sources[0]!.sourceNumber, 1);
    assert.equal(sources[1]!.kind, "note");
    assert.equal(sources[1]!.sourceNumber, 2);
  });

  it("filters below minimum similarity", () => {
    const sources = selectMixedEvidence({
      noteMatches: [
        {
          similarity: RAG_MIN_SIMILARITY - 0.01,
          note: {
            id: "n1",
            title: "Low",
            content: "x",
            type: "NOTE",
            sourceUrl: null,
            categoryId: null,
            category: null,
            createdAt: "",
            updatedAt: "",
            archivedAt: null,
            tags: [],
          },
        },
      ],
      documentMatches: [],
    });
    assert.equal(sources.length, 0);
  });

  it("limits chunks per document", () => {
    const rows = Array.from({ length: RAG_MAX_CHUNKS_PER_DOCUMENT + 2 }, (_, i) => ({
      chunkId: `c${i}`,
      documentId: "d1",
      documentTitle: "Doc",
      content: `part ${i}`,
      pageStart: i + 1,
      pageEnd: i + 1,
      chunkIndex: i,
      similarity: 0.9 - i * 0.01,
    }));

    const sources = selectMixedEvidence({
      noteMatches: [],
      documentMatches: rows,
    });

    assert.equal(sources.filter((s) => s.kind === "document").length, RAG_MAX_CHUNKS_PER_DOCUMENT);
  });
});
