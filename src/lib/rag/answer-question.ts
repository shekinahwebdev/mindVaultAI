import type { Content } from "@google/genai";

import { buildRagChatMessages } from "@/lib/ai/answer-provider/rag-prompts";
import { getActiveAnswerGenerationModel, getAnswerProvider } from "@/lib/ai/answer-provider";

import type { RagAnswerGenerationInput } from "@/lib/ai/answer-provider/input-types";

import type { ConversationContextMessage } from "./conversation-context";
import type { AnswerQuestionResult, RagSource } from "./types";

export type AnswerQuestionInput = RagAnswerGenerationInput;

/** Gemini-shaped contents for tests and debugging; built from provider-neutral messages. */
export function buildGenerationContents(
  question: string,
  sources: RagSource[],
  conversationHistory: ConversationContextMessage[],
  retrievalDisclaimer?: string,
): Content[] {
  return buildRagChatMessages({
    question,
    sources,
    conversationHistory,
    retrievalDisclaimer,
  }).map((message) => ({
    role: message.role === "user" ? "user" : "model",
    parts: [{ text: message.content }],
  }));
}

export async function answerQuestion(input: AnswerQuestionInput): Promise<AnswerQuestionResult> {
  return getAnswerProvider().generateRagAnswer(input);
}

export const RAG_GENERATION_MODEL = getActiveAnswerGenerationModel();
