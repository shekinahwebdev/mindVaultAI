import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildAssistantMetadata } from "./chat-metadata";
import { findMostRecentDirectGroundedTurn } from "./grounded-turn";

const jwtSources = [
  {
    noteId: "note-jwt",
    title: "JWT",
    categoryName: "Security",
    type: "NOTE",
  },
];

describe("findMostRecentDirectGroundedTurn", () => {
  it("returns the latest directly grounded assistant turn with user question", () => {
    const turn = findMostRecentDirectGroundedTurn([
      { id: "u1", role: "USER", content: "What did I save about JWT?" },
      {
        id: "a1",
        role: "ASSISTANT",
        content: "Your notes explain JWT bearer tokens.",
        metadata: buildAssistantMetadata(jwtSources, "answered"),
      },
    ]);

    assert.ok(turn);
    assert.equal(turn.assistantMessageId, "a1");
    assert.equal(turn.userQuestion, "What did I save about JWT?");
    assert.equal(turn.sources[0]?.noteId, "note-jwt");
  });

  it("skips no_relevant_knowledge assistants", () => {
    const turn = findMostRecentDirectGroundedTurn([
      { id: "u1", role: "USER", content: "Random?" },
      {
        id: "a1",
        role: "ASSISTANT",
        content: "Nothing found.",
        metadata: buildAssistantMetadata([], "no_relevant_knowledge"),
      },
      { id: "u2", role: "USER", content: "Explain that." },
    ]);

    assert.equal(turn, null);
  });

  it("skips history fallback and finds earlier direct grounded turn", () => {
    const turn = findMostRecentDirectGroundedTurn([
      { id: "u1", role: "USER", content: "JWT?" },
      {
        id: "a1",
        role: "ASSISTANT",
        content: "Grounded JWT answer.",
        metadata: buildAssistantMetadata(jwtSources, "answered"),
      },
      { id: "u2", role: "USER", content: "Explain that more simply." },
      {
        id: "a2",
        role: "ASSISTANT",
        content: "Simpler JWT answer.",
        metadata: buildAssistantMetadata(jwtSources, "answered_from_grounded_history", "a1"),
      },
      { id: "u3", role: "USER", content: "Make that even shorter." },
    ]);

    assert.ok(turn);
    assert.equal(turn.assistantMessageId, "a1");
    assert.equal(turn.assistantAnswer, "Grounded JWT answer.");
  });

  it("refuses malformed source metadata", () => {
    const turn = findMostRecentDirectGroundedTurn([
      { id: "u1", role: "USER", content: "JWT?" },
      {
        id: "a1",
        role: "ASSISTANT",
        content: "Looks grounded.",
        metadata: { outcome: "answered", sources: "not-an-array" },
      },
    ]);

    assert.equal(turn, null);
  });

  it("refuses answered outcome without sources", () => {
    const turn = findMostRecentDirectGroundedTurn([
      { id: "u1", role: "USER", content: "JWT?" },
      {
        id: "a1",
        role: "ASSISTANT",
        content: "No sources stored.",
        metadata: buildAssistantMetadata([], "answered"),
      },
    ]);

    assert.equal(turn, null);
  });
});
