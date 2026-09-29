import type { ChatMessage, Conversation } from "@/generated/prisma/client";
import { ChatMode, ChatRole } from "@/generated/prisma/enums";

import { parseAssistantMetadata } from "./chat-metadata";

export type SerializedChatMessage = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  sources: ReturnType<typeof parseAssistantMetadata>["sources"];
  outcome?: ReturnType<typeof parseAssistantMetadata>["outcome"];
  createdAt: string;
};

export type SerializedConversationSummary = {
  id: string;
  title: string;
  mode: "ask" | "agent";
  createdAt: string;
  updatedAt: string;
  lastMessagePreview: string | null;
};

export type SerializedConversationDetail = {
  id: string;
  title: string;
  mode: "ask" | "agent";
  createdAt: string;
  updatedAt: string;
  messages: SerializedChatMessage[];
};

export function serializeChatMode(mode: ChatMode): "ask" | "agent" {
  return mode === ChatMode.AGENT ? "agent" : "ask";
}

export function serializeChatMessage(message: ChatMessage): SerializedChatMessage {
  const metadata =
    message.role === ChatRole.ASSISTANT
      ? parseAssistantMetadata(message.metadata)
      : {};

  return {
    id: message.id,
    role: message.role,
    content: message.content,
    sources: metadata.sources,
    outcome: metadata.outcome,
    createdAt: message.createdAt.toISOString(),
  };
}

type ConversationWithLastMessage = Conversation & {
  messages: Pick<ChatMessage, "content" | "role" | "createdAt">[];
};

export function serializeConversationSummary(
  conversation: ConversationWithLastMessage,
): SerializedConversationSummary {
  const last = conversation.messages[0];
  const preview =
    last?.role === ChatRole.ASSISTANT
      ? last.content
      : last?.role === ChatRole.USER
        ? last.content
        : null;

  return {
    id: conversation.id,
    title: conversation.title ?? "New conversation",
    mode: serializeChatMode(conversation.mode),
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
    lastMessagePreview: preview ? truncatePreview(preview) : null,
  };
}

function truncatePreview(text: string, max = 72) {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

