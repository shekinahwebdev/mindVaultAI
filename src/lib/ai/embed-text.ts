import {
  getEmbeddingRetrievalProvider,
  getEmbeddingWriteProvider,
} from "./embedding-providers/config";
import { embedTextGemini } from "./embed-text-gemini";
import { embedTextOpenAI } from "./embed-text-openai";
import type { EmbedTextInput, EmbedTextResult } from "./types";

export type { EmbedTextInput, EmbedTextResult, EmbeddingTaskType } from "./types";

export {
  EMBEDDING_DIMENSIONS,
  EMBEDDING_MODEL,
  getEmbeddingRetrievalProvider,
  getEmbeddingWriteProvider,
  getRetrievalProviderSpec,
  getWriteProviderSpec,
} from "./embedding-providers/config";

async function embedWithProvider(
  provider: "gemini" | "openai",
  input: EmbedTextInput,
): Promise<EmbedTextResult> {
  if (provider === "openai") {
    return embedTextOpenAI(input);
  }
  return embedTextGemini(input);
}

/** Store-path embedding (notes, PDF chunks) — follows EMBEDDING_PROVIDER. */
export async function embedText(input: EmbedTextInput): Promise<EmbedTextResult> {
  return embedWithProvider(getEmbeddingWriteProvider(), input);
}

/** Retrieval-path embedding (search + RAG queries) — follows EMBEDDING_RETRIEVAL_PROVIDER. */
export async function embedTextForRetrieval(input: EmbedTextInput): Promise<EmbedTextResult> {
  return embedWithProvider(getEmbeddingRetrievalProvider(), input);
}
