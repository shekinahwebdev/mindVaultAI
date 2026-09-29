import {
  CHAT_PROVIDER_FAILURE_MESSAGE,
  type ChatAnswerOutcome,
} from "@/lib/chat/chat-outcomes";
import type { AskVaultSource } from "@/lib/rag/types";

import type { AskVaultInput } from "@/lib/rag/ask-vault";

import { findMostRecentDirectGroundedTurn } from "./grounded-turn";
import {
  createAssistantMessage,
  createUserMessage,
  getRecentConversationMessagesForGrounding,
  getRecentConversationMessagesForUser,
  resolveConversationForUser,
  touchConversationUpdatedAt,
} from "./chat-repository";

export type ProcessChatMessageResult =
  | {
      ok: true;
      outcome: ChatAnswerOutcome;
      conversationId: string;
      userMessageId: string;
      assistantMessageId: string;
      answer: string;
      sources: AskVaultSource[];
    }
  | {
      ok: false;
      reason: "invalid_question" | "conversation_not_found" | "provider_failure" | "server_failure";
      message: string;
      conversationId?: string;
      userMessageId?: string;
    };

type AskVaultFn = (input: AskVaultInput) => Promise<
  | {
      ok: true;
      outcome: ChatAnswerOutcome;
      answer: string;
      sources: AskVaultSource[];
      groundedFromMessageId?: string;
    }
  | { ok: false; reason: "invalid_question" | "provider_failure" }
>;

const MIN_QUESTION_LENGTH = 3;
const MAX_QUESTION_LENGTH = 500;

export async function processChatMessage(params: {
  userId: string;
  question: string;
  conversationId?: string;
  askVault: AskVaultFn;
}): Promise<ProcessChatMessageResult> {
  const trimmed = params.question.trim();

  if (trimmed.length < MIN_QUESTION_LENGTH || trimmed.length > MAX_QUESTION_LENGTH) {
    return { ok: false, reason: "invalid_question", message: "Ask a real question about your vault." };
  }

  try {
    const conversation = await resolveConversationForUser(
      params.userId,
      trimmed,
      params.conversationId,
    );

    if (!conversation) {
      return {
        ok: false,
        reason: "conversation_not_found",
        message: "Conversation not found.",
      };
    }

    const userMessage = await createUserMessage(conversation.id, trimmed);

    const conversationHistory = await getRecentConversationMessagesForUser(
      params.userId,
      conversation.id,
      { excludeMessageId: userMessage.id },
    );

    const groundingMessages = await getRecentConversationMessagesForGrounding(
      params.userId,
      conversation.id,
      { excludeMessageId: userMessage.id },
    );
    const recentDirectGroundedTurn = findMostRecentDirectGroundedTurn(groundingMessages);

    const rag = await params.askVault({
      userId: params.userId,
      question: trimmed,
      conversationHistory,
      recentDirectGroundedTurn,
    });

    if (!rag.ok) {
      if (rag.reason === "invalid_question") {
        return {
          ok: false,
          reason: "invalid_question",
          message: "Ask a real question about your vault.",
          conversationId: conversation.id,
          userMessageId: userMessage.id,
        };
      }

      return {
        ok: false,
        reason: "provider_failure",
        message: CHAT_PROVIDER_FAILURE_MESSAGE,
        conversationId: conversation.id,
        userMessageId: userMessage.id,
      };
    }

    const assistantMessage = await createAssistantMessage(
      conversation.id,
      rag.answer,
      rag.sources,
      rag.outcome,
      rag.outcome === "answered_from_grounded_history" && rag.groundedFromMessageId
        ? { groundedFromMessageId: rag.groundedFromMessageId }
        : undefined,
    );

    await touchConversationUpdatedAt(conversation.id);

    return {
      ok: true,
      outcome: rag.outcome,
      conversationId: conversation.id,
      userMessageId: userMessage.id,
      assistantMessageId: assistantMessage.id,
      answer: rag.answer,
      sources: rag.sources,
    };
  } catch {
    return {
      ok: false,
      reason: "server_failure",
      message: "Something went wrong while answering. Please try again.",
    };
  }
}
