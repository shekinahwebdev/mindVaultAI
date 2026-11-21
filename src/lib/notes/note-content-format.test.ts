import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { detectNoteContentFormat } from "./note-content-format";

describe("detectNoteContentFormat", () => {
  it("returns code and quote from note type", () => {
    assert.equal(detectNoteContentFormat("print('hi')", "CODE"), "code");
    assert.equal(detectNoteContentFormat("Words", "QUOTE"), "quote");
  });

  it("detects html bodies", () => {
    assert.equal(
      detectNoteContentFormat("<p>Hello</p>", "NOTE"),
      "html",
    );
  });

  it("detects markdown bodies", () => {
    assert.equal(
      detectNoteContentFormat("## Heading\n\n- one", "NOTE"),
      "markdown",
    );
  });

  it("falls back to plain text", () => {
    assert.equal(detectNoteContentFormat("Simple line\nSecond line", "NOTE"), "plain");
  });
});