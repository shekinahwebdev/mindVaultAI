/**
 * Provider-agnostic conversation turns for RAG / generation.
 * Not tied to Prisma — loaded in the chat layer and passed into askVault.
 */
export type ConversationContextMessage = {
  role: "user" | "assistant";
  content: string;
};

export const MAX_CONVERSATION_HISTORY_MESSAGES = 8;
export const MAX_CONVERSATION_HISTORY_CHARS = 10_000;

/**
 * Keeps the most recent messages up to count/character limits.
 * Input must already be chronological (oldest first).
 */
export function boundConversationHistory(
  messages: ConversationContextMessage[],
  options?: {
    maxMessages?: number;
    maxChars?: number;
  },
): ConversationContextMessage[] {
  const maxMessages = options?.maxMessages ?? MAX_CONVERSATION_HISTORY_MESSAGES;
  const maxChars = options?.maxChars ?? MAX_CONVERSATION_HISTORY_CHARS;

  let slice = messages.slice(-maxMessages);
  let totalChars = slice.reduce((sum, message) => sum + message.content.length, 0);

  while (slice.length > 1 && totalChars > maxChars) {
    slice = slice.slice(1);
    totalChars = slice.reduce((sum, message) => sum + message.content.length, 0);
  }

  if (slice.length === 1 && totalChars > maxChars) {
    const only = slice[0]!;
    slice = [{ ...only, content: only.content.slice(0, maxChars) }];
  }

  return slice;
}

export function conversationHistoryCharCount(messages: ConversationContextMessage[]): number {
  return messages.reduce((sum, message) => sum + message.content.length, 0);
}
