import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { normalizePageText } from "./normalize-text";

describe("normalizePageText", () => {
  it("collapses whitespace and repeated line breaks deterministically", () => {
    const input = "Hello   world\r\n\r\n\r\nNext\tline";
    const once = normalizePageText(input);
    const twice = normalizePageText(input);
    assert.equal(once, twice);
    assert.match(once, /Hello world/);
    assert.doesNotMatch(once, /\n{3,}/);
  });
});
