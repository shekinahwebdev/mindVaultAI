import OpenAI from "openai";

import { runGenerationWithRetry } from "@/lib/ai/answer-provider/run-generation";

import {
  buildNoteAnalysisUserMessage,
  getOpenAiAnalyzeModel,
  NOTE_ANALYSIS_JSON_SCHEMA,
  NOTE_ANALYSIS_SYSTEM_INSTRUCTION,
  parseNoteAnalysisSuggestion,
} from "./analyze-note-shared";
import type { NoteAnalysisInput, NoteAnalysisResult } from "./types";

const REQUEST_TIMEOUT_MS = 20_000;

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

type AnalyzeClient = {
  chat: {
    completions: {
      create: (params: {
        model: string;
        messages: Array<{ role: "system" | "user"; content: string }>;
        response_format: {
          type: "json_schema";
          json_schema: typeof NOTE_ANALYSIS_JSON_SCHEMA;
        };
      }) => Promise<{
        choices: Array<{ message?: { content?: string | null } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      }>;
    };
  };
};

export function createOpenAiNoteAnalyzer(options?: {
  apiKey?: string;
  model?: string;
  createClient?: (apiKey: string) => AnalyzeClient | null;
}) {
  const model = options?.model ?? getOpenAiAnalyzeModel();

  return async function analyzeNoteWithOpenAI(input: NoteAnalysisInput): Promise<NoteAnalysisResult> {
    const startedAt = Date.now();
    const apiKey = options?.apiKey ?? process.env.OPENAI_API_KEY;

    if (!apiKey?.trim()) {
      return {
        ok: false,
        reason: "provider_error",
        meta: { model, latencyMs: Date.now() - startedAt },
      };
    }

    const createClient =
      options?.createClient ??
      ((key: string) => new OpenAI({ apiKey: key, timeout: REQUEST_TIMEOUT_MS, maxRetries: 0 }));
    const client = createClient(apiKey);
    if (!client) {
      return {
        ok: false,
        reason: "provider_error",
        meta: { model, latencyMs: Date.now() - startedAt },
      };
    }

    const attempt = await runGenerationWithRetry({
      isRetryable,
      attempt: async () => {
        try {
          const response = await client.chat.completions.create({
            model,
            messages: [
              { role: "system", content: NOTE_ANALYSIS_SYSTEM_INSTRUCTION },
              { role: "user", content: buildNoteAnalysisUserMessage(input) },
            ],
            response_format: {
              type: "json_schema",
              json_schema: NOTE_ANALYSIS_JSON_SCHEMA,
            },
          });

          const raw = response.choices[0]?.message?.content ?? undefined;
          const suggestion = parseNoteAnalysisSuggestion(raw);
          if (!suggestion) {
            return { outcome: "invalid_output" as const };
          }

          return {
            outcome: "success" as const,
            value: suggestion,
            inputTokens: response.usage?.prompt_tokens,
            outputTokens: response.usage?.completion_tokens,
          };
        } catch (error) {
          return { outcome: "error" as const, error };
        }
      },
    });

    const latencyMs = Date.now() - startedAt;

    if (attempt.outcome === "success" && attempt.value) {
      return {
        ok: true,
        suggestion: attempt.value,
        meta: {
          model,
          latencyMs,
          inputTokens: attempt.inputTokens,
          outputTokens: attempt.outputTokens,
        },
      };
    }

    if (attempt.outcome === "invalid_output" || attempt.outcome === "success") {
      return {
        ok: false,
        reason: "invalid_output",
        meta: { model, latencyMs },
      };
    }

    return {
      ok: false,
      reason: classifyFailure(attempt.error),
      meta: { model, latencyMs },
    };
  };
}

export const analyzeNoteWithOpenAI = createOpenAiNoteAnalyzer();
