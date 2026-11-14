/**
 * Offline model of MindVault unified semantic **note** retrieval stages.
 * See search-repository.ts `semanticSearchForUser` (embed → searchNotesBySimilarity → threshold).
 */

/** Matches `SEMANTIC_NOTE_POOL` in search-repository.ts (not imported to avoid heavy deps). */
export const EVAL_CANDIDATE_POOL_K = 24;

export type ScoredCandidate = {
  id: string;
  similarity: number;
};

export type NoteSemanticPipelineResult = {
  candidateStage: ScoredCandidate[];
  finalStage: ScoredCandidate[];
};

/** When inputs contain duplicate note ids, keep the highest similarity per id. */
export function dedupeCandidatesKeepBestSimilarity(
  candidates: ScoredCandidate[],
): ScoredCandidate[] {
  const best = new Map<string, number>();
  for (const row of candidates) {
    const prev = best.get(row.id);
    if (prev === undefined || row.similarity > prev) {
      best.set(row.id, row.similarity);
    }
  }
  return [...best.entries()].map(([id, similarity]) => ({ id, similarity }));
}

export function rankCandidatesBySimilarity(candidates: ScoredCandidate[]): ScoredCandidate[] {
  const unique = dedupeCandidatesKeepBestSimilarity(candidates);
  return [...unique].sort((a, b) => {
    if (b.similarity !== a.similarity) {
      return b.similarity - a.similarity;
    }
    return a.id.localeCompare(b.id);
  });
}

/** Cap ranked list at pool K (Top-K pool before threshold). Input should already be ranked + deduped. */
export function applyCandidatePool(
  ranked: ScoredCandidate[],
  candidatePoolK: number,
): ScoredCandidate[] {
  if (candidatePoolK <= 0) {
    return [];
  }
  return ranked.slice(0, candidatePoolK);
}

export function applySimilarityThreshold(
  candidates: ScoredCandidate[],
  minSimilarity: number,
): ScoredCandidate[] {
  return candidates.filter((row) => row.similarity >= minSimilarity);
}

export function runNoteSemanticPipeline(params: {
  candidates: ScoredCandidate[];
  candidatePoolK?: number;
  minSimilarity: number;
}): NoteSemanticPipelineResult {
  const poolK = params.candidatePoolK ?? EVAL_CANDIDATE_POOL_K;
  const ranked = rankCandidatesBySimilarity(params.candidates);
  const candidateStage = applyCandidatePool(ranked, poolK);
  const finalStage = applySimilarityThreshold(candidateStage, params.minSimilarity);
  return { candidateStage, finalStage };
}

export function finalResultIds(finalStage: ScoredCandidate[]): string[] {
  return finalStage.map((row) => row.id);
}

export function candidateResultIds(candidateStage: ScoredCandidate[]): string[] {
  return candidateStage.map((row) => row.id);
}
