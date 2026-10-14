import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseLibraryListQuery } from "./library-validation";

describe("parseLibraryListQuery", () => {
  it("defaults to all content with updated_desc sort", () => {
    const query = parseLibraryListQuery(new URLSearchParams());
    assert.equal(query.type, "all");
    assert.equal(query.sort, "updated_desc");
    assert.equal(query.page, 1);
    assert.equal(query.limit, 20);
    assert.equal(query.search, null);
  });

  it("parses filters, search, and pagination", () => {
    const query = parseLibraryListQuery(
      new URLSearchParams({
        type: "document",
        sort: "title_asc",
        q: "  workflow  ",
        page: "2",
        limit: "10",
      }),
    );
    assert.equal(query.type, "document");
    assert.equal(query.sort, "title_asc");
    assert.equal(query.search, "workflow");
    assert.equal(query.page, 2);
    assert.equal(query.limit, 10);
    assert.equal(query.skip, 10);
  });

  it("rejects invalid type and caps search length", () => {
    const query = parseLibraryListQuery(
      new URLSearchParams({
        type: "invalid",
        q: "x".repeat(250),
      }),
    );
    assert.equal(query.type, "all");
    assert.equal(query.search?.length, 200);
  });
});
