import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseChatPostBody, parseRenameConversationBody } from "./chat-validation";

describe("parseChatPostBody", () => {
  it("accepts question only", () => {
    const parsed = parseChatPostBody({ question: "Hello vault" });
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.question, "Hello vault");
      assert.equal(parsed.conversationId, undefined);
    }
  });

  it("accepts optional conversationId", () => {
    const parsed = parseChatPostBody({ question: "Hi", conversationId: "conv-1" });
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.conversationId, "conv-1");
    }
  });
});

describe("parseRenameConversationBody", () => {
  it("requires a trimmed title", () => {
    const parsed = parseRenameConversationBody({ title: "  Study notes  " });
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.title, "Study notes");
    }
  });
});
