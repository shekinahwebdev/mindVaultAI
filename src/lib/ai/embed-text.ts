import { ApiError, GoogleGenAI } from "@google/genai";

import type { EmbedTextInput, EmbedTextResult, EmbeddingTaskType } from "./types";

// gemini-embedding-001: Google's stable, text-only embedding model. We
// deliberately did NOT pick gemini-embedding-2-preview — it's multimodal
// (we only ever embed text) and still Preview status, which is a bad
// foundation for a stored vector column we'd need to fully re-embed if
// the model changed shape.
const MODEL = "gemini-embedding-001";

// Reduced via outputDimensionality from the model's default of 3072.
// pgvector's HNSW/IVFFlat indexes refuse columns over 2000 dimensions
// (verified locally against pgvector 0.8.1), so 3072 would work for
// storage but could never be indexed. 768 leaves headroom, is Google's
// other widely-used embedding size, and Matryoshka-style truncation is
// designed to preserve most of the ranking quality at this size.
const DIMENSIONS = 768;

const REQUEST_TIMEOUT_MS = 15_000;

// gemini-embedding-001 embeds a "document" (something being stored for
// later retrieval) and a "query" (something searching for documents)
// slightly differently on purpose — this asymmetry is what taskType
// encodes, and it measurably improves retrieval over embedding both the
// same way.
const TASK_TYPE_BY_KIND: Record<EmbeddingTaskType, string> = {
  note: "RETRIEVAL_DOCUMENT",
  query: "RETRIEVAL_QUERY",
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

function classifyFailure(
  error: unknown,
): "timeout" | "rate_limit" | "provider_error" {
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
): Promise<
  | { outcome: "success"; embedding: number[] }
  | { outcome: "invalid_output" }
  | { outcome: "error"; error: unknown }
> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await client.models.embedContent({
      model: MODEL,
      contents: input.text,
      config: {
        taskType: TASK_TYPE_BY_KIND[input.taskType],
        outputDimensionality: DIMENSIONS,
        abortSignal: controller.signal,
      },
    });

    const embedding = response.embeddings?.[0]?.values;
    if (!embedding || embedding.length !== DIMENSIONS) {
      return { outcome: "invalid_output" };
    }

    return { outcome: "success", embedding };
  } catch (error) {
    return { outcome: "error", error };
  } finally {
    clearTimeout(timeout);
  }
}

export async function embedText(input: EmbedTextInput): Promise<EmbedTextResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  const startedAt = Date.now();

  if (!apiKey) {
    return {
      ok: false,
      reason: "provider_error",
      meta: { model: MODEL, dimensions: DIMENSIONS, latencyMs: Date.now() - startedAt },
    };
  }

  const client = new GoogleGenAI({ apiKey });

  let attempt = await attemptEmbed(client, input);

  if (attempt.outcome === "invalid_output") {
    attempt = await attemptEmbed(client, input);
  } else if (attempt.outcome === "error" && isRetryable(attempt.error)) {
    attempt = await attemptEmbed(client, input);
  }

  const latencyMs = Date.now() - startedAt;

  if (attempt.outcome === "success") {
    return {
      ok: true,
      embedding: attempt.embedding,
      meta: { model: MODEL, dimensions: DIMENSIONS, latencyMs },
    };
  }

  if (attempt.outcome === "invalid_output") {
    return {
      ok: false,
      reason: "invalid_output",
      meta: { model: MODEL, dimensions: DIMENSIONS, latencyMs },
    };
  }

  return {
    ok: false,
    reason: classifyFailure(attempt.error),
    meta: { model: MODEL, dimensions: DIMENSIONS, latencyMs },
  };
}

export const EMBEDDING_MODEL = MODEL;
export const EMBEDDING_DIMENSIONS = DIMENSIONS;
