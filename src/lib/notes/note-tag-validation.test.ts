import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseNoteTagIds } from "./note-tag-validation";

describe("parseNoteTagIds", () => {
  it("accepts empty array", () => {
    const parsed = parseNoteTagIds([]);
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.deepEqual(parsed.tagIds, []);
    }
  });

  it("deduplicates and trims IDs", () => {
    const parsed = parseNoteTagIds([" a ", "a", "b"]);
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.deepEqual(parsed.tagIds, ["a", "b"]);
    }
  });

  it("rejects non-array and non-string entries", () => {
    assert.equal(parseNoteTagIds("x").success, false);
    assert.equal(parseNoteTagIds([1]).success, false);
    assert.equal(parseNoteTagIds([""]).success, false);
  });

  it("rejects too many tags", () => {
    const ids = Array.from({ length: 21 }, (_, index) => `id-${index}`);
    assert.equal(parseNoteTagIds(ids).success, false);
  });
});
