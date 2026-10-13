import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildAssistantMetadata,
  buildUserMessageMetadata,
  parseAssistantMetadata,
  parseUserMessageMetadata,
} from "./chat-metadata";

describe("chat metadata", () => {
  it("round-trips validated assistant sources", () => {
    const metadata = buildAssistantMetadata([
      {
        noteId: "note-1",
        title: "Auth notes",
        categoryName: "Security",
        type: "NOTE",
      },
    ]);

    const parsed = parseAssistantMetadata(metadata);
    assert.equal(parsed.sources?.length, 1);
    assert.equal(parsed.sources?.[0]?.kind === "document" ? null : parsed.sources?.[0]?.noteId, "note-1");
    assert.equal(parsed.outcome, "answered");
  });

  it("persists no_relevant_knowledge outcome", () => {
    const metadata = buildAssistantMetadata([], "no_relevant_knowledge");
    const parsed = parseAssistantMetadata(metadata);
    assert.equal(parsed.outcome, "no_relevant_knowledge");
  });

  it("persists answered_from_grounded_history with trace id", () => {
    const metadata = buildAssistantMetadata(
      [{ noteId: "n1", title: "T", categoryName: null, type: "NOTE" }],
      "answered_from_grounded_history",
      "asst-base",
    );
    const parsed = parseAssistantMetadata(metadata);
    assert.equal(parsed.outcome, "answered_from_grounded_history");
    assert.equal(parsed.groundedFromMessageId, "asst-base");
  });

  it("rejects malformed metadata", () => {
    assert.deepEqual(parseAssistantMetadata({ sources: "bad" }), {});
  });

  it("round-trips user message PDF attachments", () => {
    const metadata = buildUserMessageMetadata([
      { documentId: "doc-1", title: "Patricia_Freelance_Web_Development_Guide.pdf" },
    ]);
    assert.ok(metadata);
    const parsed = parseUserMessageMetadata(metadata);
    assert.equal(parsed.attachments.length, 1);
    assert.equal(parsed.attachments[0]?.documentId, "doc-1");
  });
});
