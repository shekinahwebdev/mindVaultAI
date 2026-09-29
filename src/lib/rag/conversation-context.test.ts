import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { boundConversationHistory } from "./conversation-context";

describe("boundConversationHistory", () => {
  it("keeps the most recent messages within the message limit", () => {
    const messages = Array.from({ length: 12 }, (_, index) => ({
      role: "user" as const,
      content: `message-${index}`,
    }));

    const bounded = boundConversationHistory(messages, { maxMessages: 8, maxChars: 50_000 });
    assert.equal(bounded.length, 8);
    assert.equal(bounded[0]?.content, "message-4");
    assert.equal(bounded[7]?.content, "message-11");
  });

  it("drops oldest messages when character budget is exceeded", () => {
    const bounded = boundConversationHistory(
      [
        { role: "user", content: "A".repeat(6000) },
        { role: "assistant", content: "B".repeat(6000) },
      ],
      { maxMessages: 8, maxChars: 10_000 },
    );

    assert.equal(bounded.length, 1);
    assert.equal(bounded[0]?.role, "assistant");
  });
});
