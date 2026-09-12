import { semanticSearchNotes } from "@/lib/notes/embedding-service";

import type { RagSource, RetrieveContextResult } from "./types";

/**
 * Deliberately reuses the exact same pgvector cosine search that powers
 * the Semantic Search page (embedding-service.ts) — RAG is not a second
 * retrieval implementation, just a stricter consumer of the same one.
 */

// 5, not the search UI's default of 8: a question like "how does
// authentication work" genuinely needs both the JWT and OAuth notes, so
// 1 is too few, but every extra note is more context the model has to
// read (cost/latency) and more chance of pulling in something
// marginally-related that muddies the answer. 5 sits at the upper end
// of the task's suggested 3–5 range because note-level context (no
// chunking yet) is short, so the budget cost of a 5th note is small.
const RAG_TOP_K = 5;

// Calibrated against real RAG queries on an 8-note test vault. The
// correct note for a query consistently scored 0.68–0.75; genuinely
// unrelated notes, because top-k always returns *something*, still
// scored 0.50–0.61 (short, similarly-worded technical notes compress
// together in cosine space more than you'd expect). 0.6 was the value
// that kept every correct top-hit while cutting most — not all — of
// that noise; a completely off-topic question's best match topped out
// at 0.53, comfortably below this line, so the no-answer path still
// fires correctly.
//   - Too high (e.g. 0.75): a real but loosely-worded match gets
//     dropped, and MindVault wrongly claims to have nothing saved.
//   - Too low (e.g. 0.3): unrelated notes leak into context, and the
//     model either gets confused or answers from a tangentially-related
//     note as if it were relevant.
// This is a first-pass value tuned on a small dev dataset, not a
// universal constant — worth revisiting with real usage data, and a
// better long-term fix than hand-tuning one global number is likely
// reranking (explicitly deferred — see the final report).
const RAG_MIN_SIMILARITY = 0.6;

export async function retrieveRagContext(
  userId: string,
  question: string,
): Promise<RetrieveContextResult> {
  const result = await semanticSearchNotes(userId, question, RAG_TOP_K);

  if (!result.ok) {
    return { ok: false, reason: result.reason };
  }

  const sources: RagSource[] = result.matches
    .filter((match) => match.similarity >= RAG_MIN_SIMILARITY)
    .map((match, index) => ({
      sourceNumber: index + 1,
      noteId: match.note.id,
      title: match.note.title,
      content: match.note.content,
      categoryName: match.note.category?.name ?? null,
      type: match.note.type,
      similarity: match.similarity,
    }));

  return { ok: true, sources };
}

export const RAG_TOP_K_VALUE = RAG_TOP_K;
export const RAG_MIN_SIMILARITY_VALUE = RAG_MIN_SIMILARITY;
