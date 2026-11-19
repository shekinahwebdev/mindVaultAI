export type RetrievalMetrics = {
  precisionAtK: number;
  recallAtK: number | null;
  f1: number | null;
  candidateRecallAtK: number | null;
  returnedCount: number;
  candidateCount: number;
};

/**
 * Precision@K on a ranked id list: hits in first K positions divided by K.
 */
export function precisionAtK(rankedIds: string[], relevantIds: Iterable<string>, k: number): number {
  if (k <= 0) {
    return 0;
  }
  const relevant = new Set(relevantIds);
  const top = rankedIds.slice(0, k);
  if (top.length === 0) {
    return 0;
  }
  const hits = top.filter((id) => relevant.has(id)).length;
  return hits / k;
}

/**
 * Recall@K: fraction of all labeled relevant ids found in the first K positions.
 */
export function recallAtK(
  rankedIds: string[],
  relevantIds: Iterable<string>,
  k: number,
): number | null {
  const relevant = new Set(relevantIds);
  if (relevant.size === 0) {
    return null;
  }
  const top = rankedIds.slice(0, k);
  const hits = top.filter((id) => relevant.has(id)).length;
  return hits / relevant.size;
}

export function f1Score(precision: number, recall: number | null): number | null {
  if (recall === null) {
    return null;
  }
  if (precision + recall === 0) {
    return 0;
  }
  return (2 * precision * recall) / (precision + recall);
}

export function candidateRecallAtK(
  candidateRankedIds: string[],
  relevantIds: Iterable<string>,
  k: number,
): number | null {
  return recallAtK(candidateRankedIds, relevantIds, k);
}

export function computeRetrievalMetrics(params: {
  finalRankedIds: string[];
  candidateRankedIds: string[];
  relevantIds: string[];
  k: number;
}): RetrievalMetrics {
  const { finalRankedIds, candidateRankedIds, relevantIds, k } = params;
  const precision = precisionAtK(finalRankedIds, relevantIds, k);
  const recall = recallAtK(finalRankedIds, relevantIds, k);
  const candRecall = candidateRecallAtK(candidateRankedIds, relevantIds, k);

  return {
    precisionAtK: precision,
    recallAtK: recall,
    f1: f1Score(precision, recall),
    candidateRecallAtK: candRecall,
    returnedCount: finalRankedIds.length,
    candidateCount: candidateRankedIds.length,
  };
}
