const MAX_CONVERSATION_TITLE_LENGTH = 80;

export function conversationTitleFromFirstMessage(question: string): string {
  const trimmed = question.trim().replace(/\s+/g, " ");
  if (trimmed.length <= MAX_CONVERSATION_TITLE_LENGTH) {
    return trimmed;
  }
  return `${trimmed.slice(0, MAX_CONVERSATION_TITLE_LENGTH - 1)}…`;
}

export const CONVERSATION_TITLE_MAX_LENGTH = MAX_CONVERSATION_TITLE_LENGTH;
