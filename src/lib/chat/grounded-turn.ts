import type { ChatAnswerOutcome } from "@/lib/chat/chat-outcomes";
import type { AskVaultSource } from "@/lib/rag/types";

import { parseAssistantMetadata } from "./chat-metadata";

/** Message shape used when scanning recent conversation rows for grounding. */
export type GroundingConversationMessage = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  metadata?: unknown;
};

/**
 * A prior turn grounded directly from fresh vault retrieval (not from history fallback).
 * Used only when current retrieval returns zero sources.
 */
export type DirectGroundedTurn = {
  assistantMessageId: string;
  userQuestion: string;
  assistantAnswer: string;
  sources: AskVaultSource[];
};

function isDirectGroundedOutcome(
  outcome: ChatAnswerOutcome | undefined,
  sources: AskVaultSource[],
): boolean {
  if (sources.length === 0) {
    return false;
  }
  if (outcome === "no_relevant_knowledge" || outcome === "answered_from_grounded_history") {
    return false;
  }
  if (outcome === "answered") {
    return true;
  }
  // Legacy rows before outcome was persisted — sources imply direct RAG.
  if (outcome === undefined) {
    return true;
  }
  return false;
}

/**
 * Validates assistant metadata for direct vault grounding.
 * Returns null when metadata is missing, malformed, or not a direct grounded answer.
 */
export function parseDirectGroundedAssistant(
  metadata: unknown,
): { outcome: ChatAnswerOutcome; sources: AskVaultSource[] } | null {
  const parsed = parseAssistantMetadata(metadata);
  const sources = parsed.sources ?? [];
  if (!isDirectGroundedOutcome(parsed.outcome, sources)) {
    return null;
  }
  return { outcome: parsed.outcome ?? "answered", sources };
}

/**
 * Finds the most recent assistant message that was grounded directly from the vault
 * (outcome answered + validated sources). Skips history-fallback answers so chains
 * cannot compound. Pairs with the immediately preceding user message when present.
 */
export function findMostRecentDirectGroundedTurn(
  messages: GroundingConversationMessage[],
): DirectGroundedTurn | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role !== "ASSISTANT") {
      continue;
    }

    const grounded = parseDirectGroundedAssistant(message.metadata);
    if (!grounded) {
      continue;
    }

    const prior = messages[index - 1];
    const userQuestion =
      prior?.role === "USER" ? prior.content : "Previous question in this conversation.";

    return {
      assistantMessageId: message.id,
      userQuestion,
      assistantAnswer: message.content,
      sources: grounded.sources,
    };
  }

  return null;
}
