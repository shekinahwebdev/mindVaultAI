import type { Prisma } from "@/generated/prisma/client";
import { ChatMode, ChatRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import type { ChatAnswerOutcome } from "@/lib/chat/chat-outcomes";
import type { AskVaultSource } from "@/lib/rag/types";

import type { ConversationContextMessage } from "@/lib/rag/conversation-context";
import { boundConversationHistory } from "@/lib/rag/conversation-context";

import { buildAssistantMetadata } from "./chat-metadata";
import type { GroundingConversationMessage } from "./grounded-turn";
import { conversationTitleFromFirstMessage } from "./chat-title";
import {
  serializeChatMessage,
  serializeConversationSummary,
  type SerializedConversationDetail,
  type SerializedConversationSummary,
} from "./serialize";

const LIST_CONVERSATIONS_LIMIT = 50;

export async function listConversationsForUser(
  userId: string,
  limit = LIST_CONVERSATIONS_LIMIT,
): Promise<SerializedConversationSummary[]> {
  const rows = await prisma.conversation.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true, role: true, createdAt: true },
      },
    },
  });

  return rows.map(serializeConversationSummary);
}

export async function getConversationForUser(
  userId: string,
  conversationId: string,
): Promise<SerializedConversationDetail | null> {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!conversation) {
    return null;
  }

  return {
    id: conversation.id,
    title: conversation.title ?? "New conversation",
    mode: conversation.mode === ChatMode.AGENT ? "agent" : "ask",
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
    messages: conversation.messages.map(serializeChatMessage),
  };
}

export async function createConversationForUser(
  userId: string,
  firstQuestion: string,
  mode: ChatMode = ChatMode.ASK,
) {
  return prisma.conversation.create({
    data: {
      userId,
      title: conversationTitleFromFirstMessage(firstQuestion),
      mode,
    },
  });
}

export async function resolveConversationForUser(
  userId: string,
  question: string,
  conversationId?: string,
) {
  if (conversationId) {
    return prisma.conversation.findFirst({
      where: { id: conversationId, userId },
    });
  }

  return createConversationForUser(userId, question);
}

export async function createUserMessage(
  conversationId: string,
  content: string,
) {
  return prisma.chatMessage.create({
    data: {
      conversationId,
      role: ChatRole.USER,
      content,
    },
  });
}

export async function createAssistantMessage(
  conversationId: string,
  content: string,
  sources: AskVaultSource[],
  outcome: ChatAnswerOutcome = "answered",
  options?: { groundedFromMessageId?: string },
) {
  const metadata = buildAssistantMetadata(
    sources,
    outcome,
    options?.groundedFromMessageId,
  ) as Prisma.InputJsonValue;

  return prisma.chatMessage.create({
    data: {
      conversationId,
      role: ChatRole.ASSISTANT,
      content,
      metadata,
    },
  });
}

export async function touchConversationUpdatedAt(conversationId: string) {
  return prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });
}

export async function deleteConversationForUser(
  userId: string,
  conversationId: string,
): Promise<boolean> {
  const result = await prisma.conversation.deleteMany({
    where: { id: conversationId, userId },
  });
  return result.count > 0;
}

export async function renameConversationForUser(
  userId: string,
  conversationId: string,
  title: string,
): Promise<boolean> {
  const result = await prisma.conversation.updateMany({
    where: { id: conversationId, userId },
    data: { title },
  });
  return result.count > 0;
}

function toContextRole(role: ChatRole): ConversationContextMessage["role"] {
  return role === ChatRole.USER ? "user" : "assistant";
}

/**
 * Loads prior messages in chronological order for model context.
 * Excludes the current user message (saved just before askVault runs).
 */
export async function getRecentConversationMessagesForUser(
  userId: string,
  conversationId: string,
  options: {
    excludeMessageId: string;
    maxMessages?: number;
    maxChars?: number;
  },
): Promise<ConversationContextMessage[]> {
  const owned = await prisma.conversation.findFirst({
    where: { id: conversationId, userId },
    select: { id: true },
  });

  if (!owned) {
    return [];
  }

  const maxMessages = options.maxMessages ?? 8;

  const rows = await prisma.chatMessage.findMany({
    where: {
      conversationId,
      id: { not: options.excludeMessageId },
    },
    orderBy: { createdAt: "desc" },
    take: maxMessages,
    select: { role: true, content: true },
  });

  const chronological = rows.reverse().map((row) => ({
    role: toContextRole(row.role),
    content: row.content,
  }));

  return boundConversationHistory(chronological, {
    maxMessages: options.maxMessages,
    maxChars: options.maxChars,
  });
}

/**
 * Recent messages (excluding current user turn) with ids + metadata for grounded fallback.
 */
export async function getRecentConversationMessagesForGrounding(
  userId: string,
  conversationId: string,
  options: {
    excludeMessageId: string;
    maxMessages?: number;
  },
): Promise<GroundingConversationMessage[]> {
  const owned = await prisma.conversation.findFirst({
    where: { id: conversationId, userId },
    select: { id: true },
  });

  if (!owned) {
    return [];
  }

  const maxMessages = options.maxMessages ?? 8;

  const rows = await prisma.chatMessage.findMany({
    where: {
      conversationId,
      id: { not: options.excludeMessageId },
    },
    orderBy: { createdAt: "desc" },
    take: maxMessages,
    select: { id: true, role: true, content: true, metadata: true },
  });

  return rows.reverse().map((row) => ({
    id: row.id,
    role: row.role,
    content: row.content,
    metadata: row.metadata ?? undefined,
  }));
}
