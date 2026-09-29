import "dotenv/config";

import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { prisma } from "@/lib/db";

import {
  createAssistantMessage,
  createConversationForUser,
  createUserMessage,
  deleteConversationForUser,
  getConversationForUser,
  getRecentConversationMessagesForUser,
  listConversationsForUser,
  renameConversationForUser,
} from "./chat-repository";

const runIntegration = Boolean(process.env.DATABASE_URL);

describe("chat repository ownership", { skip: !runIntegration }, () => {
  let userAId = "";
  let userBId = "";
  let conversationAId = "";

  before(async () => {
    const suffix = Date.now();
    const [userA, userB] = await Promise.all([
      prisma.user.create({
        data: { email: `chat-repo-a-${suffix}@example.com`, passwordHash: "x" },
      }),
      prisma.user.create({
        data: { email: `chat-repo-b-${suffix}@example.com`, passwordHash: "x" },
      }),
    ]);
    userAId = userA.id;
    userBId = userB.id;

    const conversation = await createConversationForUser(
      userAId,
      "What have I saved about authentication?",
    );
    conversationAId = conversation.id;
    await createUserMessage(conversationAId, "What have I saved about authentication?");
    await createAssistantMessage(conversationAId, "JWT notes.", []);
  });

  after(async () => {
    if (userAId) await prisma.user.delete({ where: { id: userAId } }).catch(() => {});
    if (userBId) await prisma.user.delete({ where: { id: userBId } }).catch(() => {});
    await prisma.$disconnect();
  });

  it("lists only the owner's conversations", async () => {
    const listA = await listConversationsForUser(userAId);
    const listB = await listConversationsForUser(userBId);
    assert.ok(listA.some((item) => item.id === conversationAId));
    assert.equal(listB.length, 0);
  });

  it("blocks cross-user read", async () => {
    const detail = await getConversationForUser(userBId, conversationAId);
    assert.equal(detail, null);
  });

  it("blocks cross-user delete", async () => {
    const deleted = await deleteConversationForUser(userBId, conversationAId);
    assert.equal(deleted, false);
    const stillThere = await getConversationForUser(userAId, conversationAId);
    assert.ok(stillThere);
  });

  it("loads bounded prior messages excluding the current user message", async () => {
    const userMsg = await createUserMessage(conversationAId, "Follow-up question");
    const history = await getRecentConversationMessagesForUser(userBId, conversationAId, {
      excludeMessageId: userMsg.id,
    });
    assert.equal(history.length, 0);

    const ownerHistory = await getRecentConversationMessagesForUser(userAId, conversationAId, {
      excludeMessageId: userMsg.id,
    });
    assert.equal(ownerHistory.length, 2);
    assert.equal(ownerHistory[0]?.role, "user");
    assert.match(ownerHistory[0]?.content ?? "", /authentication/);
  });

  it("allows owner rename and delete", async () => {
    const renamed = await renameConversationForUser(userAId, conversationAId, "Auth chat");
    assert.equal(renamed, true);

    const deleted = await deleteConversationForUser(userAId, conversationAId);
    assert.equal(deleted, true);
    assert.equal(await getConversationForUser(userAId, conversationAId), null);
  });
});
