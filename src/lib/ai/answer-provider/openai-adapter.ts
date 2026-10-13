import OpenAI from "openai";

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

const RAG_JSON_SCHEMA = {
  name: "mindvault_rag_answer",
  strict: true,
  schema: {
    type: "object",
    properties: {
      answer: { type: "string" },
      sourceNumbers: {
        type: "array",
        items: { type: "integer" },
      },
    },
    required: ["answer", "sourceNumbers"],
    additionalProperties: false,
  },
} as const;

const GROUNDED_JSON_SCHEMA = {
  name: "mindvault_grounded_follow_up",
  strict: true,
  schema: {
    type: "object",
    properties: {
      answer: { type: "string" },
    },
    required: ["answer"],
    additionalProperties: false,
  },
} as const;

function isRetryable(error: unknown): boolean {
  if (error instanceof OpenAI.APIError) {
    return error.status === 429 || (error.status ?? 0) >= 500;
  }
  if (
    error instanceof OpenAI.APIConnectionTimeoutError ||
    error instanceof OpenAI.APIConnectionError
  ) {
    return true;
  }
  if ((error as { name?: string } | undefined)?.name === "AbortError") {
    return true;
  }
  return false;
}

function classifyFailure(error: unknown): "timeout" | "rate_limit" | "provider_error" {
  if (error instanceof OpenAI.APIError) {
    if (error.status === 429) {
      return "rate_limit";
    }
    return "provider_error";
  }
  if (
    error instanceof OpenAI.APIConnectionTimeoutError ||
    (error as { name?: string } | undefined)?.name === "AbortError"
  ) {
    return "timeout";
  }
  return "provider_error";
}

export type OpenAiClientFactory = () => OpenAI | null;

export function createOpenAiAnswerAdapter(options?: {
  apiKey?: string;
  model?: string;
  createClient?: OpenAiClientFactory;
}) {
  const model = options?.model ?? getConfiguredAnswerModel("openai");

  function createClient(): OpenAI | null {
    if (options?.createClient) {
      return options.createClient();
    }
    const apiKey = options?.apiKey ?? process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return null;
    }
    return new OpenAI({ apiKey, timeout: REQUEST_TIMEOUT_MS });
  }

  async function generateRagAnswer(input: RagAnswerGenerationInput): Promise<AnswerQuestionResult> {
    const startedAt = Date.now();
    const client = createClient();
    if (!client) {
      return {
        ok: false,
        reason: "provider_error",
        meta: { model, latencyMs: Date.now() - startedAt },
      };
    }

    const chatMessages = buildRagChatMessages({
      question: input.question,
      sources: input.sources,
      conversationHistory: input.conversationHistory ?? [],
      retrievalDisclaimer: input.retrievalDisclaimer,
    });

    const attempt = await runGenerationWithRetry<ParsedRagAnswer>({
      isRetryable,
      attempt: async () => {
        try {
          const response = await client.chat.completions.create({
            model,
            messages: [
              { role: "system", content: RAG_ANSWER_SYSTEM_INSTRUCTION },
              ...chatMessages.map((message) => ({
                role: message.role,
                content: message.content,
              })),
            ],
            response_format: {
              type: "json_schema",
              json_schema: RAG_JSON_SCHEMA,
            },
          });

          const raw = response.choices[0]?.message?.content;
          if (!raw) {
            return { outcome: "invalid_output" as const };
          }

          let parsed: unknown;
          try {
            parsed = JSON.parse(raw);
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
            inputTokens: response.usage?.prompt_tokens,
            outputTokens: response.usage?.completion_tokens,
          };
        } catch (error) {
          return { outcome: "error" as const, error };
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
    const client = createClient();
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
        try {
          const response = await client.chat.completions.create({
            model,
            messages: [
              { role: "system", content: GROUNDED_HISTORY_SYSTEM_INSTRUCTION },
              {
                role: "user",
                content: buildGroundedHistoryUserMessage(input),
              },
            ],
            response_format: {
              type: "json_schema",
              json_schema: GROUNDED_JSON_SCHEMA,
            },
          });

          const raw = response.choices[0]?.message?.content;
          if (!raw) {
            return { outcome: "invalid_output" as const };
          }

          let parsed: unknown;
          try {
            parsed = JSON.parse(raw);
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
            inputTokens: response.usage?.prompt_tokens,
            outputTokens: response.usage?.completion_tokens,
          };
        } catch (error) {
          return { outcome: "error" as const, error };
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
    id: "openai" as const,
    model,
    generateRagAnswer,
    generateGroundedFollowUp,
  };
}
