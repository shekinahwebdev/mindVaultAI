import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildTagsListUrl,
  getMutationFieldError,
  TAG_CLIENT_ERROR,
} from "./tags-client";
import { TAG_DUPLICATE_MESSAGE } from "./tag-errors";

describe("tags client", () => {
  it("buildTagsListUrl omits empty query and default filter", () => {
    assert.equal(buildTagsListUrl(), "/api/tags");
    assert.equal(buildTagsListUrl({ filter: "all" }), "/api/tags");
    assert.equal(buildTagsListUrl({ q: "   " }), "/api/tags");
  });

  it("buildTagsListUrl encodes search, sort, and filter", () => {
    assert.equal(
      buildTagsListUrl({ q: "dev", sort: "name_asc", filter: "unused" }),
      "/api/tags?q=dev&sort=name_asc&filter=unused",
    );
    assert.equal(
      buildTagsListUrl({ sort: "least_used" }),
      "/api/tags?sort=least_used",
    );
  });

  it("getMutationFieldError prefers field errors", () => {
    assert.deepEqual(
      getMutationFieldError({
        ok: false,
        errors: { name: TAG_DUPLICATE_MESSAGE },
      }),
      { fieldError: TAG_DUPLICATE_MESSAGE },
    );

    assert.deepEqual(
      getMutationFieldError({ ok: false, message: "Custom error" }),
      { formError: "Custom error" },
    );

    assert.deepEqual(getMutationFieldError(null), {});
    assert.deepEqual(getMutationFieldError({ ok: true, tag: {} as never }), {});

    assert.deepEqual(getMutationFieldError({ ok: false }), {
      formError: TAG_CLIENT_ERROR,
    });
  });
});
