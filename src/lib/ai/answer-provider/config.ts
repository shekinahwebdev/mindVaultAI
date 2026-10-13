import { GEMINI_CHAT_GENERATION_MODEL } from "@/lib/ai/gemini-chat-models";

export type AnswerProviderId = "gemini" | "openai";

/** Default OpenAI chat model for grounded RAG answers (structured JSON). */
export const OPENAI_ANSWER_MODEL = "gpt-4o-mini";

export function getAnswerProviderId(): AnswerProviderId {
  const raw = process.env.AI_ANSWER_PROVIDER?.trim().toLowerCase();
  if (raw === "openai") {
    return "openai";
  }
  return "gemini";
}

export function getConfiguredAnswerModel(provider: AnswerProviderId = getAnswerProviderId()): string {
  if (provider === "openai") {
    return process.env.OPENAI_ANSWER_MODEL?.trim() || OPENAI_ANSWER_MODEL;
  }
  return GEMINI_CHAT_GENERATION_MODEL;
}
