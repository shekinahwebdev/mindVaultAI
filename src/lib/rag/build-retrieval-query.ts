import type { ConversationContextMessage } from "./conversation-context";
import { RETRIEVAL_EMBEDDING_QUERY_MAX_CHARS } from "./retrieval-query-limits";

/**
 * Builds an embedding search query from recent dialogue + the current question.
 * Used only for semantic retrieval — never shown in the UI and never stored.
 */
export function buildRetrievalQuery(
  currentQuestion: string,
  conversationHistory: ConversationContextMessage[],
): string {
  const trimmedQuestion = currentQuestion.trim();
  if (conversationHistory.length === 0) {
    return trimmedQuestion;
  }

  const lines: string[] = ["Recent conversation context for retrieval:"];

  for (const message of conversationHistory) {
    const label = message.role === "user" ? "User" : "Assistant";
    lines.push(`${label}: ${message.content.trim()}`);
  }

  lines.push(`Current question: ${trimmedQuestion}`);

  const query = lines.join("\n");
  if (query.length <= RETRIEVAL_EMBEDDING_QUERY_MAX_CHARS) {
    return query;
  }

  return query.slice(0, RETRIEVAL_EMBEDDING_QUERY_MAX_CHARS);
}
