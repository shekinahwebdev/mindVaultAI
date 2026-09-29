import "dotenv/config";

import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { prisma } from "@/lib/db";

import { getConversationForUser } from "./chat-repository";
import { processChatMessage } from "./process-chat-message";

const runIntegration = Boolean(process.env.DATABASE_URL);

describe("processChatMessage", { skip: !runIntegration }, () => {
  let userId = "";

  before(async () => {
    const user = await prisma.user.create({
      data: {
        email: `chat-process-${Date.now()}@example.com`,
        passwordHash: "x",
      },
    });
    userId = user.id;
  });

  after(async () => {
    if (userId) {
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  it("persists user and assistant messages with sources", async () => {
    const result = await processChatMessage({
      userId,
      question: "What have I saved about authentication?",
      askVault: async () => ({
        ok: true,
        outcome: "answered" as const,
        answer: "You saved JWT notes.",
        sources: [
          {
            noteId: "note-auth",
            title: "JWT",
            categoryName: "Security",
            type: "NOTE",
          },
        ],
      }),
    });

    assert.equal(result.ok, true);
    if (!result.ok) return;

    const conversation = await getConversationForUser(userId, result.conversationId);
    assert.ok(conversation);
    assert.equal(conversation.messages.length, 2);
    assert.equal(conversation.title, "What have I saved about authentication?");
    assert.equal(conversation.messages[1]?.sources?.[0]?.noteId, "note-auth");
  });

  it("keeps user message when provider fails", async () => {
    const result = await processChatMessage({
      userId,
      question: "Retry me",
      askVault: async () => ({ ok: false, reason: "provider_failure" }),
    });

    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.ok(result.conversationId);
    assert.ok(result.userMessageId);

    const conversation = await getConversationForUser(userId, result.conversationId!);
    assert.ok(conversation);
    assert.equal(conversation.messages.length, 1);
    assert.equal(conversation.messages[0]?.role, "USER");
  });

  it("loads prior messages into askVault on follow-up turns", async () => {
    let capturedHistoryLength = -1;

    const first = await processChatMessage({
      userId,
      question: "What have I saved about JWT authentication?",
      askVault: async () => ({
        ok: true,
        outcome: "answered" as const,
        answer: "JWT notes.",
        sources: [],
      }),
    });

    assert.equal(first.ok, true);
    if (!first.ok) return;

    await processChatMessage({
      userId,
      question: "Compare that to sessions.",
      conversationId: first.conversationId,
      askVault: async (input) => {
        capturedHistoryLength = input.conversationHistory?.length ?? 0;
        return {
          ok: true,
          outcome: "answered" as const,
          answer: "Comparison.",
          sources: [],
        };
      },
    });

    assert.equal(capturedHistoryLength, 2);
  });

  it("persists no-answer assistant responses", async () => {
    const result = await processChatMessage({
      userId,
      question: "Unknown topic",
      askVault: async () => ({
        ok: true,
        outcome: "no_relevant_knowledge" as const,
        answer: "I couldn't find anything in your vault that answers that question.",
        sources: [],
      }),
    });

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.outcome, "no_relevant_knowledge");

    const conversation = await getConversationForUser(userId, result.conversationId);
    assert.equal(conversation?.messages[1]?.content.includes("couldn't find anything"), true);
    assert.deepEqual(conversation?.messages[1]?.sources, []);
  });
});
