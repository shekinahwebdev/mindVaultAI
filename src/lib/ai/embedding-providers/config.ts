export type EmbeddingProviderName = "gemini" | "openai";

export type EmbeddingProviderSpec = {
  provider: EmbeddingProviderName;
  model: string;
  dimensions: number;
};

const GEMINI_SPEC: EmbeddingProviderSpec = {
  provider: "gemini",
  model: "gemini-embedding-001",
  dimensions: 768,
};

const OPENAI_DEFAULT_MODEL = "text-embedding-3-small";
const OPENAI_DEFAULT_DIMENSIONS = 768;

function parseProvider(raw: string | undefined, fallback: EmbeddingProviderName): EmbeddingProviderName {
  if (raw === "openai" || raw === "gemini") {
    return raw;
  }
  return fallback;
}

/** Provider used when storing new note/chunk embeddings. */
export function getEmbeddingWriteProvider(): EmbeddingProviderName {
  return parseProvider(process.env.EMBEDDING_PROVIDER, "gemini");
}

/** Provider used for semantic query embeddings + vector search (must match stored column). */
export function getEmbeddingRetrievalProvider(): EmbeddingProviderName {
  // Default gemini until EMBEDDING_RETRIEVAL_PROVIDER=openai after backfill + verification.
  return parseProvider(process.env.EMBEDDING_RETRIEVAL_PROVIDER, "gemini");
}

export function getOpenAIEmbeddingModel(): string {
  return process.env.OPENAI_EMBEDDING_MODEL?.trim() || OPENAI_DEFAULT_MODEL;
}

export function getOpenAIEmbeddingDimensions(): number {
  const raw = process.env.OPENAI_EMBEDDING_DIMENSIONS;
  if (!raw) return OPENAI_DEFAULT_DIMENSIONS;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : OPENAI_DEFAULT_DIMENSIONS;
}

export function getProviderSpec(provider: EmbeddingProviderName): EmbeddingProviderSpec {
  if (provider === "openai") {
    return {
      provider: "openai",
      model: getOpenAIEmbeddingModel(),
      dimensions: getOpenAIEmbeddingDimensions(),
    };
  }
  return GEMINI_SPEC;
}

export function getWriteProviderSpec(): EmbeddingProviderSpec {
  return getProviderSpec(getEmbeddingWriteProvider());
}

export function getRetrievalProviderSpec(): EmbeddingProviderSpec {
  return getProviderSpec(getEmbeddingRetrievalProvider());
}

export function validateEmbeddingEnvironment(provider: EmbeddingProviderName): string | null {
  if (provider === "openai") {
    if (!process.env.OPENAI_API_KEY?.trim()) {
      return "OPENAI_API_KEY is not configured.";
    }
    const dims = getOpenAIEmbeddingDimensions();
    if (dims !== 768) {
      return "OPENAI_EMBEDDING_DIMENSIONS must be 768 for pgvector storage.";
    }
    return null;
  }
  if (!process.env.GEMINI_API_KEY?.trim()) {
    return "GEMINI_API_KEY is not configured.";
  }
  return null;
}

/** @deprecated Use getWriteProviderSpec().model — kept for legacy imports. */
export const EMBEDDING_MODEL = GEMINI_SPEC.model;
/** @deprecated Use getWriteProviderSpec().dimensions */
export const EMBEDDING_DIMENSIONS = GEMINI_SPEC.dimensions;
