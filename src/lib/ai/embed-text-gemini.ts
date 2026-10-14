import { ApiError, GoogleGenAI } from "@google/genai";

import { getProviderSpec } from "./embedding-providers/config";
import type { EmbedTextInput, EmbedTextResult } from "./types";

const REQUEST_TIMEOUT_MS = 15_000;

const TASK_TYPE_BY_KIND = {
  note: "RETRIEVAL_DOCUMENT",
  query: "RETRIEVAL_QUERY",
} as const;

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

async function attemptEmbed(
  client: GoogleGenAI,
  input: EmbedTextInput,
  dimensions: number,
  model: string,
): Promise<
  | { outcome: "success"; embedding: number[] }
  | { outcome: "invalid_output" }
  | { outcome: "error"; error: unknown }
> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await client.models.embedContent({
      model,
      contents: input.text,
      config: {
        taskType: TASK_TYPE_BY_KIND[input.taskType],
        outputDimensionality: dimensions,
        abortSignal: controller.signal,
      },
    });

    const embedding = response.embeddings?.[0]?.values;
    if (!embedding || embedding.length !== dimensions) {
      return { outcome: "invalid_output" };
    }

    return { outcome: "success", embedding };
  } catch (error) {
    return { outcome: "error", error };
  } finally {
    clearTimeout(timeout);
  }
}

export async function embedTextGemini(input: EmbedTextInput): Promise<EmbedTextResult> {
  const spec = getProviderSpec("gemini");
  const apiKey = process.env.GEMINI_API_KEY;
  const startedAt = Date.now();

  if (!apiKey) {
    return {
      ok: false,
      reason: "provider_error",
      meta: { model: spec.model, dimensions: spec.dimensions, latencyMs: Date.now() - startedAt },
    };
  }

  const client = new GoogleGenAI({ apiKey });

  let attempt = await attemptEmbed(client, input, spec.dimensions, spec.model);

  if (attempt.outcome === "invalid_output") {
    attempt = await attemptEmbed(client, input, spec.dimensions, spec.model);
  } else if (attempt.outcome === "error" && isRetryable(attempt.error)) {
    attempt = await attemptEmbed(client, input, spec.dimensions, spec.model);
  }

  const latencyMs = Date.now() - startedAt;

  if (attempt.outcome === "success") {
    return {
      ok: true,
      embedding: attempt.embedding,
      meta: { model: spec.model, dimensions: spec.dimensions, latencyMs },
    };
  }

  if (attempt.outcome === "invalid_output") {
    return {
      ok: false,
      reason: "invalid_output",
      meta: { model: spec.model, dimensions: spec.dimensions, latencyMs },
    };
  }

  return {
    ok: false,
    reason: classifyFailure(attempt.error),
    meta: { model: spec.model, dimensions: spec.dimensions, latencyMs },
  };
}
