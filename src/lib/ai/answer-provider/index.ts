import type { AnswerQuestionResult } from "@/lib/rag/types";

import type {
  GroundedHistoryGenerationInput,
  RagAnswerGenerationInput,
} from "./input-types";

import {
  type AnswerProviderId,
  getAnswerProviderId,
  getConfiguredAnswerModel,
} from "./config";
import { createGeminiAnswerAdapter } from "./gemini-adapter";
import { createOpenAiAnswerAdapter } from "./openai-adapter";

export type AnswerProvider = {
  id: AnswerProviderId;
  model: string;
  generateRagAnswer: (input: RagAnswerGenerationInput) => Promise<AnswerQuestionResult>;
  generateGroundedFollowUp: (
    input: GroundedHistoryGenerationInput,
  ) => ReturnType<ReturnType<typeof createGeminiAnswerAdapter>["generateGroundedFollowUp"]>;
};

export function createAnswerProvider(providerId: AnswerProviderId = getAnswerProviderId()): AnswerProvider {
  if (providerId === "openai") {
    return createOpenAiAnswerAdapter();
  }
  return createGeminiAnswerAdapter();
}

let cachedProvider: AnswerProvider | null = null;
let cachedProviderKey: AnswerProviderId | null = null;

/** Resolves the configured answer provider (singleton per process for default config). */
export function getAnswerProvider(): AnswerProvider {
  const id = getAnswerProviderId();
  if (cachedProvider && cachedProviderKey === id) {
    return cachedProvider;
  }
  cachedProvider = createAnswerProvider(id);
  cachedProviderKey = id;
  return cachedProvider;
}

export function getActiveAnswerGenerationModel(): string {
  return getConfiguredAnswerModel(getAnswerProviderId());
}

export { getAnswerProviderId, getConfiguredAnswerModel } from "./config";
export { RagAnswerSchema, GroundedHistoryAnswerSchema } from "./schemas";
export { buildRagChatMessages } from "./rag-prompts";
