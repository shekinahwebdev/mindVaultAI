import { embedText } from "@/lib/ai/embed-text";
import { searchDocumentChunksBySimilarity } from "@/lib/documents/document-chunk-search";
import { searchNotesBySimilarity } from "@/lib/notes/embedding-repository";

import {
  RAG_DOCUMENT_CHUNK_TOP_K,
  RAG_NOTE_TOP_K,
  selectMixedEvidence,
} from "./select-evidence";
import {
  isValidRetrievalEmbeddingQuery,
  RETRIEVAL_EMBEDDING_QUERY_MAX_CHARS,
} from "./retrieval-query-limits";
import type { RetrieveContextResult } from "./types";

const RETRIEVAL_TIMEOUT_MS = 8_000;

export type RetrieveRagContextOptions = {
  /** READY document ids to search (may be empty when attachments are still processing). */
  documentIds?: string[];
  /** When false and attachments are active, skip note search. */
  includeNotes?: boolean;
  /** When true, do not search unrelated vault PDFs. */
  restrictToAttachedDocuments?: boolean;
};

function summarizeRetrievalError(reason: unknown): string {
  if (reason instanceof Error) {
    return reason.name === "retrieval_timeout" ? "retrieval_timeout" : reason.message.slice(0, 120);
  }
  return "unknown";
}

async function withRetrievalTimeout<T>(promise: Promise<T>): Promise<T> {
  let timeout: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error("retrieval_timeout")), RETRIEVAL_TIMEOUT_MS);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeout!);
  }
}

/**
 * Unified retrieval: one query embedding, parallel note + document chunk search.
 */
export async function retrieveRagContext(
  userId: string,
  question: string,
  options: RetrieveRagContextOptions = {},
): Promise<RetrieveContextResult> {
  const query = question.trim();
  if (!isValidRetrievalEmbeddingQuery(query)) {
    console.log("[rag:retrieve]", {
      operation: "embed_query",
      outcome: "invalid_query",
      queryCharCount: query.length,
      maxChars: RETRIEVAL_EMBEDDING_QUERY_MAX_CHARS,
    });
    return { ok: false, reason: "invalid_query" };
  }

  const embedded = await embedText({ text: query, taskType: "query" });
  if (!embedded.ok) {
    return { ok: false, reason: embedded.reason };
  }

  const availability = {
    noteSearchUnavailable: false,
    documentSearchUnavailable: false,
  };

  let noteRows: Awaited<ReturnType<typeof searchNotesBySimilarity>> = [];
  let documentRows: Awaited<ReturnType<typeof searchDocumentChunksBySimilarity>> = [];

  const scopedDocumentIds = options.documentIds ?? [];
  const documentScoped = options.restrictToAttachedDocuments === true;
  const includeNotes = documentScoped ? (options.includeNotes ?? false) : true;

  const noteSearchPromise = includeNotes
    ? withRetrievalTimeout(searchNotesBySimilarity(userId, embedded.embedding, RAG_NOTE_TOP_K))
    : Promise.resolve([] as Awaited<ReturnType<typeof searchNotesBySimilarity>>);

  const documentSearchPromise = withRetrievalTimeout(
    searchDocumentChunksBySimilarity(userId, embedded.embedding, RAG_DOCUMENT_CHUNK_TOP_K, {
      documentIds: documentScoped ? scopedDocumentIds : undefined,
      restrictToDocumentIds: documentScoped,
    }),
  );

  const [notesResult, documentsResult] = await Promise.allSettled([
    noteSearchPromise,
    documentSearchPromise,
  ]);

  if (notesResult.status === "fulfilled") {
    noteRows = notesResult.value;
  } else {
    availability.noteSearchUnavailable = true;
    console.log("[rag:retrieve]", {
      operation: "note_search",
      outcome: "failed",
      reason: summarizeRetrievalError(notesResult.reason),
      documentScoped,
    });
  }

  if (documentsResult.status === "fulfilled") {
    documentRows = documentsResult.value;
  } else {
    availability.documentSearchUnavailable = true;
    console.log("[rag:retrieve]", {
      operation: "document_search",
      outcome: "failed",
      reason: summarizeRetrievalError(documentsResult.reason),
      documentScoped,
      scopedDocumentCount: scopedDocumentIds.length,
    });
  }

  if (availability.noteSearchUnavailable && availability.documentSearchUnavailable) {
    const noteReason =
      notesResult.status === "rejected" ? summarizeRetrievalError(notesResult.reason) : null;
    const docReason =
      documentsResult.status === "rejected" ? summarizeRetrievalError(documentsResult.reason) : null;
    const timedOut = noteReason === "retrieval_timeout" || docReason === "retrieval_timeout";
    console.log("[rag:retrieve]", {
      operation: "unified_retrieval",
      outcome: "failed",
      noteReason,
      docReason,
    });
    return { ok: false, reason: timedOut ? "timeout" : "provider_error" };
  }

  const noteMatches = noteRows.map((row) => ({
    note: {
      id: row.id,
      title: row.title,
      content: row.content,
      type: row.type,
      sourceUrl: row.sourceUrl,
      categoryId: row.categoryId,
      category:
        row.categoryId && row.categoryName
          ? { id: row.categoryId, name: row.categoryName }
          : null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      archivedAt: null,
      tags: [],
    },
    similarity: row.similarity,
  }));

  const sources = selectMixedEvidence({
    noteMatches,
    documentMatches: documentRows,
  });

  return { ok: true, sources, availability };
}

export { RAG_MIN_SIMILARITY, RAG_NOTE_TOP_K as RAG_TOP_K_VALUE } from "./select-evidence";
export const RAG_MIN_SIMILARITY_VALUE = 0.6;
