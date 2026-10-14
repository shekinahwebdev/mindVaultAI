import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { messagesToTurns } from "./messages-to-turns";
import type { SerializedChatMessage } from "./serialize";

describe("messagesToTurns", () => {
  it("maps user message attachments onto the turn", () => {
    const messages: SerializedChatMessage[] = [
      {
        id: "u1",
        role: "USER",
        content: "tell me about this pdf?",
        attachments: [{ documentId: "d1", title: "Guide.pdf" }],
        sources: undefined,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "a1",
        role: "ASSISTANT",
        content: "Summary.",
        attachments: [],
        sources: [],
        createdAt: "2026-01-01T00:00:01.000Z",
      },
    ];

    const turns = messagesToTurns(messages);
    assert.equal(turns.length, 1);
    assert.equal(turns[0]?.attachedDocuments?.[0]?.title, "Guide.pdf");
  });
});
