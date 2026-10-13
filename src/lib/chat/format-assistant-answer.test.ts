import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  parseAssistantAnswerBlocks,
  stripAssistantMarkdown,
} from "./format-assistant-answer";

describe("format-assistant-answer", () => {
  it("strips inline bold markdown", () => {
    assert.equal(stripAssistantMarkdown("**Core Rule**: explain it."), "Core Rule: explain it.");
  });

  it("parses numbered and bullet blocks", () => {
    const blocks = parseAssistantAnswerBlocks(
      "Intro paragraph.\n\n1. **First**: one\n2. **Second**: two\n   - nested detail",
    );
    assert.equal(blocks[0]?.type, "paragraph");
    assert.equal(blocks[1]?.type, "ordered-list");
    if (blocks[1]?.type === "ordered-list") {
      assert.match(blocks[1].items[0] ?? "", /First/);
    }
  });
});
