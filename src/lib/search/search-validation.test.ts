import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseSearchListQuery, validateSearchQuery } from "./search-validation";

describe("parseSearchListQuery", () => {
  it("defaults to keyword all content", () => {
    const query = parseSearchListQuery(new URLSearchParams({ q: "hello" }));
    assert.equal(query.mode, "keyword");
    assert.equal(query.type, "all");
    assert.equal(query.page, 1);
    assert.equal(query.limit, 20);
    assert.equal(query.q, "hello");
  });

  it("parses mode, type, filters, and pagination", () => {
    const query = parseSearchListQuery(
      new URLSearchParams({
        q: "workflow",
        mode: "semantic",
        type: "document",
        tagId: "tag-1",
        collectionId: "coll-2",
        page: "2",
        limit: "10",
      }),
    );
    assert.equal(query.mode, "semantic");
    assert.equal(query.type, "document");
    assert.equal(query.tagId, "tag-1");
    assert.equal(query.collectionId, "coll-2");
    assert.equal(query.skip, 10);
  });
});

describe("validateSearchQuery", () => {
  it("rejects empty and enforces semantic length bounds", () => {
    const empty = validateSearchQuery(parseSearchListQuery(new URLSearchParams()));
    assert.equal(empty.ok, false);

    const short = validateSearchQuery(
      parseSearchListQuery(new URLSearchParams({ q: "a", mode: "semantic" })),
    );
    assert.equal(short.ok, false);

    const ok = validateSearchQuery(
      parseSearchListQuery(new URLSearchParams({ q: "valid query", mode: "semantic" })),
    );
    assert.equal(ok.ok, true);
  });
});
