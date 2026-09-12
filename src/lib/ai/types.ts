import type { NoteType } from "@/generated/prisma/enums";

export type NoteAnalysisInput = {
  content: string;
  categoryNames: string[];
};

export type NoteAnalysisSuggestion = {
  title: string;
  type: NoteType;
  category: string | null;
};

export type NoteAnalysisMeta = {
  model: string;
  latencyMs: number;
  inputTokens?: number;
  outputTokens?: number;
};

export type NoteAnalysisResult =
  | { ok: true; suggestion: NoteAnalysisSuggestion; meta: NoteAnalysisMeta }
  | {
      ok: false;
      reason: "timeout" | "rate_limit" | "provider_error" | "invalid_output";
      meta: Pick<NoteAnalysisMeta, "model" | "latencyMs">;
    };

// Embeddings are a distinct capability from generation above: text in,
// numbers out, no wording/structure to validate. "note" and "query" get
// embedded slightly differently (see embed-text.ts) so retrieval works
// well even though both end up as vectors in the same space.
export type EmbeddingTaskType = "note" | "query";

export type EmbedTextInput = {
  text: string;
  taskType: EmbeddingTaskType;
};

export type EmbedTextMeta = {
  model: string;
  dimensions: number;
  latencyMs: number;
};

export type EmbedTextResult =
  | { ok: true; embedding: number[]; meta: EmbedTextMeta }
  | {
      ok: false;
      reason: "timeout" | "rate_limit" | "provider_error" | "invalid_output";
      meta: Pick<EmbedTextMeta, "model" | "dimensions" | "latencyMs">;
    };
