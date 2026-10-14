import { ApiError, GoogleGenAI, type Content, Type } from "@google/genai";

import { GEMINI_CHAT_GENERATION_MODEL } from "@/lib/ai/gemini-chat-models";
import type {
  GroundedHistoryGenerationInput,
  RagAnswerGenerationInput,
} from "./input-types";
import type { AnswerQuestionMeta, AnswerQuestionResult } from "@/lib/rag/types";

import { getConfiguredAnswerModel } from "./config";
import {
  buildGroundedHistoryUserMessage,
  buildRagChatMessages,
  GROUNDED_HISTORY_SYSTEM_INSTRUCTION,
  RAG_ANSWER_SYSTEM_INSTRUCTION,
} from "./rag-prompts";
import { runGenerationWithRetry } from "./run-generation";
import {
  GroundedHistoryAnswerSchema,
  RagAnswerSchema,
  type ParsedRagAnswer,
} from "./schemas";

const REQUEST_TIMEOUT_MS = 20_000;

const RAG_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    answer: { type: Type.STRING },
    sourceNumbers: { type: Type.ARRAY, items: { type: Type.INTEGER } },
  },
  required: ["answer", "sourceNumbers"],
};

const GROUNDED_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    answer: { type: Type.STRING },
  },
  required: ["answer"],
};

function isRetryable(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.status === 429 || error.status >= 500;
  }
  if ((error as { name?: string } | undefined)?.name === "AbortError") {
    return true;
  }
  return false;
}

function classifyFailure(error: unknown): "timeout" | "rate_limit" | "provider_error" {
  if (error instanceof ApiError) {
    if (error.status === 429) {
      return "rate_limit";
    }
    return "provider_error";
  }
  if ((error as { name?: string } | undefined)?.name === "AbortError") {
    return "timeout";
  }
  return "provider_error";
}

function toGeminiContents(messages: ReturnType<typeof buildRagChatMessages>): Content[] {
  return messages.map((message) => ({
    role: message.role === "user" ? "user" : "model",
    parts: [{ text: message.content }],
  }));
}

export function createGeminiAnswerAdapter(options?: { apiKey?: string; model?: string }) {
  const model = options?.model ?? getConfiguredAnswerModel("gemini");

  async function requireClient(): Promise<GoogleGenAI | null> {
    const apiKey = options?.apiKey ?? process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }
    return new GoogleGenAI({ apiKey });
  }

  async function generateRagAnswer(input: RagAnswerGenerationInput): Promise<AnswerQuestionResult> {
    const startedAt = Date.now();
    const client = await requireClient();
    if (!client) {
      return {
        ok: false,
        reason: "provider_error",
        meta: { model, latencyMs: Date.now() - startedAt },
      };
    }

    const attempt = await runGenerationWithRetry<ParsedRagAnswer>({
      isRetryable,
      attempt: async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        try {
          const response = await client.models.generateContent({
            model,
            contents: toGeminiContents(
              buildRagChatMessages({
                question: input.question,
                sources: input.sources,
                conversationHistory: input.conversationHistory ?? [],
                retrievalDisclaimer: input.retrievalDisclaimer,
              }),
            ),
            config: {
              systemInstruction: RAG_ANSWER_SYSTEM_INSTRUCTION,
              responseMimeType: "application/json",
              responseSchema: RAG_RESPONSE_SCHEMA,
              abortSignal: controller.signal,
            },
          });

          let parsed: unknown;
          try {
            parsed = JSON.parse(response.text ?? "");
          } catch {
            return { outcome: "invalid_output" as const };
          }

          const result = RagAnswerSchema.safeParse(parsed);
          if (!result.success) {
            return { outcome: "invalid_output" as const };
          }

          return {
            outcome: "success" as const,
            value: result.data,
            inputTokens: response.usageMetadata?.promptTokenCount,
            outputTokens: response.usageMetadata?.candidatesTokenCount,
          };
        } catch (error) {
          return { outcome: "error" as const, error };
        } finally {
          clearTimeout(timeout);
        }
      },
    });

    const latencyMs = Date.now() - startedAt;

    if (attempt.outcome === "success") {
      return {
        ok: true,
        answer: attempt.value,
        meta: {
          model,
          latencyMs,
          inputTokens: attempt.inputTokens,
          outputTokens: attempt.outputTokens,
        },
      };
    }

    if (attempt.outcome === "invalid_output") {
      return { ok: false, reason: "invalid_output", meta: { model, latencyMs } };
    }

    return {
      ok: false,
      reason: classifyFailure(attempt.error),
      meta: { model, latencyMs },
    };
  }

  async function generateGroundedFollowUp(
    input: GroundedHistoryGenerationInput,
  ): Promise<
    | { ok: true; answer: string; meta: AnswerQuestionMeta }
    | {
        ok: false;
        reason: "timeout" | "rate_limit" | "provider_error" | "invalid_output";
        meta: Pick<AnswerQuestionMeta, "model" | "latencyMs">;
      }
  > {
    const startedAt = Date.now();
    const client = await requireClient();
    if (!client) {
      return {
        ok: false,
        reason: "provider_error",
        meta: { model, latencyMs: Date.now() - startedAt },
      };
    }

    const attempt = await runGenerationWithRetry<string>({
      isRetryable,
      attempt: async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        try {
          const response = await client.models.generateContent({
            model,
            contents: [
              {
                role: "user",
                parts: [{ text: buildGroundedHistoryUserMessage(input) }],
              },
            ],
            config: {
              systemInstruction: GROUNDED_HISTORY_SYSTEM_INSTRUCTION,
              responseMimeType: "application/json",
              responseSchema: GROUNDED_RESPONSE_SCHEMA,
              abortSignal: controller.signal,
            },
          });

          let parsed: unknown;
          try {
            parsed = JSON.parse(response.text ?? "");
          } catch {
            return { outcome: "invalid_output" as const };
          }

          const result = GroundedHistoryAnswerSchema.safeParse(parsed);
          if (!result.success) {
            return { outcome: "invalid_output" as const };
          }

          return {
            outcome: "success" as const,
            value: result.data.answer,
            inputTokens: response.usageMetadata?.promptTokenCount,
            outputTokens: response.usageMetadata?.candidatesTokenCount,
          };
        } catch (error) {
          return { outcome: "error" as const, error };
        } finally {
          clearTimeout(timeout);
        }
      },
    });

    const latencyMs = Date.now() - startedAt;

    if (attempt.outcome === "success") {
      return {
        ok: true,
        answer: attempt.value,
        meta: {
          model,
          latencyMs,
          inputTokens: attempt.inputTokens,
          outputTokens: attempt.outputTokens,
        },
      };
    }

    if (attempt.outcome === "invalid_output") {
      return { ok: false, reason: "invalid_output", meta: { model, latencyMs } };
    }

    return {
      ok: false,
      reason: classifyFailure(attempt.error),
      meta: { model, latencyMs },
    };
  }

  return {
    id: "gemini" as const,
    model,
    generateRagAnswer,
    generateGroundedFollowUp,
  };
}

export const GEMINI_DEFAULT_ANSWER_MODEL = GEMINI_CHAT_GENERATION_MODEL;
