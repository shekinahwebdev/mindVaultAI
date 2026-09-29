import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { conversationTitleFromFirstMessage } from "./chat-title";

describe("conversationTitleFromFirstMessage", () => {
  it("uses the full question when short enough", () => {
    assert.equal(
      conversationTitleFromFirstMessage("What have I saved about authentication?"),
      "What have I saved about authentication?",
    );
  });

  it("truncates long questions with ellipsis", () => {
    const long = "A".repeat(100);
    const title = conversationTitleFromFirstMessage(long);
    assert.ok(title.length <= 80);
    assert.match(title, /…$/);
  });
});
