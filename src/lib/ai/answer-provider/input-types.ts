import type { ConversationContextMessage } from "@/lib/rag/conversation-context";
import type { RagSource } from "@/lib/rag/types";

export type RagAnswerGenerationInput = {
  question: string;
  sources: RagSource[];
  conversationHistory?: ConversationContextMessage[];
  retrievalDisclaimer?: string;
};

export type GroundedHistoryGenerationInput = {
  priorUserQuestion: string;
  priorAssistantAnswer: string;
  currentQuestion: string;
};
