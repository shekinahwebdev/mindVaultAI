/**
 * Provider-independent RAG types. Nothing here should leak
 * Gemini-specific response shapes into the API route or UI — same
 * pattern as src/lib/ai/types.ts for Analyze and embeddings.
 */

// A note that passed retrieval + the relevance threshold, renumbered
// 1..N for this request only. The model only ever sees/cites this
// number — never the real database id — so there is nothing for it to
// "invent" that could resolve to a real note (see answer-question.ts).
export type RagSource = {
  sourceNumber: number;
  noteId: string;
  title: string;
  content: string;
  categoryName: string | null;
  type: string;
  similarity: number;
};

export type RetrieveContextResult =
  | { ok: true; sources: RagSource[] }
  | {
      ok: false;
      reason: "invalid_query" | "provider_error" | "rate_limit" | "timeout" | "invalid_output";
    };

export type RagAnswer = {
  answer: string;
  sourceNumbers: number[];
};

export type AnswerQuestionMeta = {
  model: string;
  latencyMs: number;
  inputTokens?: number;
  outputTokens?: number;
};

export type AnswerQuestionResult =
  | { ok: true; answer: RagAnswer; meta: AnswerQuestionMeta }
  | {
      ok: false;
      reason: "timeout" | "rate_limit" | "provider_error" | "invalid_output";
      meta: Pick<AnswerQuestionMeta, "model" | "latencyMs">;
    };

// What the API route sends to the browser. `sources` here are always
// server-validated — a subset of what was actually retrieved, never
// whatever the model happened to say.
export type AskVaultSource = {
  noteId: string;
  title: string;
  categoryName: string | null;
  type: string;
};

export type AskVaultResult =
  | { ok: true; answer: string; sources: AskVaultSource[] }
  | { ok: false; reason: "invalid_question" | "unavailable" };
