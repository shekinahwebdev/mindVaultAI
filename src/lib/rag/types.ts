/**
 * Provider-independent RAG types. Nothing here should leak
 * Gemini-specific response shapes into the API route or UI.
 */

export type RagNoteSource = {
  kind: "note";
  sourceNumber: number;
  noteId: string;
  title: string;
  content: string;
  categoryName: string | null;
  type: string;
  similarity: number;
};

export type RagDocumentSource = {
  kind: "document";
  sourceNumber: number;
  documentId: string;
  chunkId: string;
  title: string;
  content: string;
  pageStart: number;
  pageEnd: number;
  similarity: number;
};

export type RagSource = RagNoteSource | RagDocumentSource;

export type RetrievalAvailability = {
  noteSearchUnavailable?: boolean;
  documentSearchUnavailable?: boolean;
};

export type RetrieveContextResult =
  | { ok: true; sources: RagSource[]; availability: RetrievalAvailability }
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

export type AskVaultNoteSource = {
  /** Omitted on legacy persisted rows; treated as a note. */
  kind?: "note";
  noteId: string;
  title: string;
  categoryName: string | null;
  type: string;
};

export type AskVaultDocumentSource = {
  kind: "document";
  documentId: string;
  chunkId: string;
  title: string;
  pageStart: number;
  pageEnd: number;
};

/** Legacy rows may omit `kind` — treated as notes when parsing metadata. */
export type AskVaultSource = AskVaultNoteSource | AskVaultDocumentSource;

export type AskVaultSuccessOutcome =
  | "answered"
  | "answered_from_grounded_history"
  | "no_relevant_knowledge";

export type AskVaultResult =
  | {
      ok: true;
      outcome: AskVaultSuccessOutcome;
      answer: string;
      sources: AskVaultSource[];
      groundedFromMessageId?: string;
      retrievalAvailability?: RetrievalAvailability;
    }
  | { ok: false; reason: "invalid_question" | "provider_failure" | "ai_limit_reached" };

export function isAskVaultDocumentSource(
  source: AskVaultSource,
): source is AskVaultDocumentSource {
  return source.kind === "document";
}

export function ragSourceToAskVaultSource(source: RagSource): AskVaultSource {
  if (source.kind === "document") {
    return {
      kind: "document",
      documentId: source.documentId,
      chunkId: source.chunkId,
      title: source.title,
      pageStart: source.pageStart,
      pageEnd: source.pageEnd,
    };
  }
  return {
    kind: "note",
    noteId: source.noteId,
    title: source.title,
    categoryName: source.categoryName,
    type: source.type,
  };
}
