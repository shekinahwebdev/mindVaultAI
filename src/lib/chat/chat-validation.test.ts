import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseChatPostBody, parseRenameConversationBody } from "./chat-validation";

describe("parseChatPostBody", () => {
  it("accepts question only", () => {
    const parsed = parseChatPostBody({ question: "Hello vault" });
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.question, "Hello vault");
      assert.equal(parsed.data.conversationId, undefined);
      assert.deepEqual(parsed.data.attachedDocumentIds, []);
    }
  });

  it("accepts optional conversationId", () => {
    const parsed = parseChatPostBody({ question: "Hi", conversationId: "conv-1" });
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.conversationId, "conv-1");
    }
  });

  it("parses attachment ids and include-notes flag", () => {
    const parsed = parseChatPostBody({
      question: "Explain this PDF",
      attachedDocumentIds: ["doc-1", "doc-1"],
      attachmentIncludeNotes: true,
    });
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.deepEqual(parsed.data.attachedDocumentIds, ["doc-1"]);
      assert.equal(parsed.data.attachmentIncludeNotes, true);
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
