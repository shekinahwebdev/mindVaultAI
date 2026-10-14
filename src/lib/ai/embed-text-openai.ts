import OpenAI from "openai";

import {
  getOpenAIEmbeddingDimensions,
  getOpenAIEmbeddingModel,
  getProviderSpec,
} from "./embedding-providers/config";
import type { EmbedTextInput, EmbedTextResult } from "./types";

const REQUEST_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 2;

function classifyFailure(error: unknown): "timeout" | "rate_limit" | "provider_error" {
  if (error instanceof OpenAI.APIError) {
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

function isRetryable(error: unknown): boolean {
  if (error instanceof OpenAI.APIError) {
    return error.status === 429 || error.status >= 500;
  }
  if ((error as { name?: string } | undefined)?.name === "AbortError") {
    return true;
  }
  return false;
}

type OpenAIEmbeddingsClient = {
  embeddings: {
    create: (params: {
      model: string;
      input: string;
      dimensions: number;
    }) => Promise<{ data: Array<{ embedding?: number[] }> }>;
  };
};

export function createOpenAIEmbedder(options?: {
  apiKey?: string;
  createClient?: (apiKey: string) => OpenAIEmbeddingsClient | null;
}) {
  return async function embedTextOpenAI(input: EmbedTextInput): Promise<EmbedTextResult> {
    const spec = getProviderSpec("openai");
    const model = getOpenAIEmbeddingModel();
    const dimensions = getOpenAIEmbeddingDimensions();
    const apiKey = options?.apiKey ?? process.env.OPENAI_API_KEY;
    const startedAt = Date.now();

    if (!apiKey?.trim()) {
      return {
        ok: false,
        reason: "provider_error",
        meta: { model, dimensions, latencyMs: Date.now() - startedAt },
      };
    }

    if (dimensions !== spec.dimensions) {
      return {
        ok: false,
        reason: "invalid_output",
        meta: { model, dimensions, latencyMs: Date.now() - startedAt },
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
        meta: { model, dimensions, latencyMs: Date.now() - startedAt },
      };
    }

    let lastError: unknown;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
      try {
        const response = await client.embeddings.create({
          model,
          input: input.text,
          dimensions,
        });
        const embedding = response.data[0]?.embedding;
        if (!embedding || embedding.length !== dimensions) {
          return {
            ok: false,
            reason: "invalid_output",
            meta: { model, dimensions, latencyMs: Date.now() - startedAt },
          };
        }
        return {
          ok: true,
          embedding,
          meta: { model, dimensions, latencyMs: Date.now() - startedAt },
        };
      } catch (error) {
        lastError = error;
        if (attempt < MAX_RETRIES && isRetryable(error)) {
          continue;
        }
        break;
      }
    }

    return {
      ok: false,
      reason: classifyFailure(lastError),
      meta: { model, dimensions, latencyMs: Date.now() - startedAt },
    };
  };
}

export const embedTextOpenAI = createOpenAIEmbedder();
