/** User-facing copy for chat / RAG outcomes (not errors). */
export const CHAT_NO_RELEVANT_KNOWLEDGE_ANSWER =
  "I couldn't find anything in your vault that answers that question.";

export const CHAT_NO_RELEVANT_KNOWLEDGE_HINT =
  "Try asking about something you've saved.";

/** Temporary provider/Gemini failures — user should retry. */
export const CHAT_PROVIDER_FAILURE_MESSAGE =
  "MindVault couldn't answer right now. Please try again.";

/** Unexpected server errors — user should retry. */
export const CHAT_SERVER_FAILURE_MESSAGE =
  "Something went wrong while answering. Please try again.";

export const CHAT_GROUNDED_HISTORY_LABEL = "Based on the previous sourced answer";

export type ChatAnswerOutcome =
  | "answered"
  | "answered_from_grounded_history"
  | "no_relevant_knowledge";

export type ChatFailureError =
  | "invalid_question"
  | "conversation_not_found"
  | "provider_failure"
  | "server_failure";
