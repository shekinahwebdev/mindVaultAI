import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL, embedText } from "@/lib/ai/embed-text";
import { prisma } from "@/lib/db";

import { buildNoteEmbeddingInput } from "./embedding-input";
import {
  findNoteIdsNeedingEmbedding,
  searchNotesBySimilarity,
  upsertNoteEmbedding,
} from "./embedding-repository";
import type { SerializedNote } from "./serialize";

export type NoteForEmbedding = {
  id: string;
  title: string;
  content: string;
};

export type GenerateEmbeddingOutcome =
  | { ok: true }
  | { ok: false; reason: "provider_error" | "rate_limit" | "timeout" | "invalid_output" };

/**
 * Best-effort: generates and stores a note's embedding, but never throws.
 * A note's own save already succeeded by the time this runs — an
 * embedding-provider hiccup here must never turn into a failed save for
 * the user, or the vault's core function (keep what I saved) would depend
 * on a third-party AI service being up. The backfill script exists
 * precisely to repair whatever this call fails to produce.
 */
export async function generateAndStoreNoteEmbedding(
  note: NoteForEmbedding,
): Promise<GenerateEmbeddingOutcome> {
  const startedAt = Date.now();
  const text = buildNoteEmbeddingInput(note.title, note.content);

  const result = await embedText({ text, taskType: "note" });

  if (!result.ok) {
    console.log("[ai:embed-note]", {
      provider: "gemini",
      model: result.meta.model,
      operation: "embed_note",
      ok: false,
      latencyMs: result.meta.latencyMs,
      reason: result.reason,
    });
    return { ok: false, reason: result.reason };
  }

  try {
    await upsertNoteEmbedding(note.id, result.embedding, result.meta.model, result.meta.dimensions);
  } catch (error) {
    console.error("[ai:embed-note] storage failed:", error);
    return { ok: false, reason: "provider_error" };
  }

  console.log("[ai:embed-note]", {
    provider: "gemini",
    model: result.meta.model,
    operation: "embed_note",
    ok: true,
    latencyMs: Date.now() - startedAt,
    dimensions: result.meta.dimensions,
  });

  return { ok: true };
}

export type BackfillResult = {
  total: number;
  succeeded: number;
  failed: number;
};

/**
 * Embeds every note for a user that has no current embedding (or whose
 * embedding was made by a previous model/dimension configuration). Used
 * by the backfill script — safe to re-run, since a note whose embedding
 * is already current is simply not selected next time.
 */
export async function backfillEmbeddingsForUser(userId: string): Promise<BackfillResult> {
  const idsNeedingEmbedding = await findNoteIdsNeedingEmbedding(
    userId,
    EMBEDDING_MODEL,
    EMBEDDING_DIMENSIONS,
  );

  if (idsNeedingEmbedding.length === 0) {
    return { total: 0, succeeded: 0, failed: 0 };
  }

  const notes = await prisma.note.findMany({
    where: { id: { in: idsNeedingEmbedding } },
    select: { id: true, title: true, content: true },
  });
  const notesById = new Map(notes.map((note) => [note.id, note]));

  let succeeded = 0;
  let failed = 0;

  for (const id of idsNeedingEmbedding) {
    const note = notesById.get(id);
    if (!note) {
      failed += 1;
      continue;
    }

    const outcome = await generateAndStoreNoteEmbedding(note);
    if (outcome.ok) {
      succeeded += 1;
    } else {
      failed += 1;
    }
  }

  return { total: idsNeedingEmbedding.length, succeeded, failed };
}

const SEMANTIC_SEARCH_MIN_QUERY_LENGTH = 2;
const SEMANTIC_SEARCH_MAX_QUERY_LENGTH = 500;
const SEMANTIC_SEARCH_DEFAULT_TOP_K = 8;
const SEMANTIC_SEARCH_MAX_TOP_K = 10;

export type SemanticSearchMatch = {
  note: SerializedNote;
  similarity: number;
};

export type SemanticSearchOutcome =
  | { ok: true; matches: SemanticSearchMatch[] }
  | { ok: false; reason: "invalid_query" | "provider_error" | "rate_limit" | "timeout" | "invalid_output" };

/**
 * Query -> embedding -> pgvector cosine similarity -> top-k notes owned
 * by userId. userId always comes from the caller's session (see the API
 * route), never from request input — this function has no way to search
 * across users because searchNotesBySimilarity requires it as a
 * parameter, not an optional filter.
 */
export async function semanticSearchNotes(
  userId: string,
  rawQuery: string,
  topK: number = SEMANTIC_SEARCH_DEFAULT_TOP_K,
): Promise<SemanticSearchOutcome> {
  const query = rawQuery.trim();

  if (
    query.length < SEMANTIC_SEARCH_MIN_QUERY_LENGTH ||
    query.length > SEMANTIC_SEARCH_MAX_QUERY_LENGTH
  ) {
    return { ok: false, reason: "invalid_query" };
  }

  const boundedTopK = Math.max(1, Math.min(topK, SEMANTIC_SEARCH_MAX_TOP_K));
  const startedAt = Date.now();

  const embedded = await embedText({ text: query, taskType: "query" });

  if (!embedded.ok) {
    console.log("[ai:embed-query]", {
      provider: "gemini",
      model: embedded.meta.model,
      operation: "embed_query",
      ok: false,
      latencyMs: embedded.meta.latencyMs,
      reason: embedded.reason,
    });
    return { ok: false, reason: embedded.reason };
  }

  const rows = await searchNotesBySimilarity(userId, embedded.embedding, boundedTopK);

  console.log("[ai:embed-query]", {
    provider: "gemini",
    model: embedded.meta.model,
    operation: "embed_query",
    ok: true,
    latencyMs: Date.now() - startedAt,
    resultCount: rows.length,
  });

  const matches: SemanticSearchMatch[] = rows.map((row) => ({
    note: {
      id: row.id,
      title: row.title,
      content: row.content,
      type: row.type,
      sourceUrl: row.sourceUrl,
      categoryId: row.categoryId,
      category: row.categoryId && row.categoryName
        ? { id: row.categoryId, name: row.categoryName }
        : null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    },
    similarity: row.similarity,
  }));

  return { ok: true, matches };
}

export const SEMANTIC_SEARCH_TOP_K_DEFAULT = SEMANTIC_SEARCH_DEFAULT_TOP_K;
