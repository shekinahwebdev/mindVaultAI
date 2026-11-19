import { computeRetrievalMetrics, type RetrievalMetrics } from "./metrics";
import {
  candidateResultIds,
  EVAL_CANDIDATE_POOL_K,
  finalResultIds,
  runNoteSemanticPipeline,
} from "./pipeline";
import type { EvalQueryCase } from "./fixtures";

export type ThresholdComparisonRow = {
  queryId: string;
  threshold: number;
  metrics: RetrievalMetrics;
};

export type EvaluateQueryOptions = {
  minSimilarity: number;
  evalK: number;
  candidatePoolK?: number;
};

export function evaluateQueryCase(
  queryCase: EvalQueryCase,
  options: EvaluateQueryOptions,
): {
  candidateStageIds: string[];
  finalStageIds: string[];
  metrics: RetrievalMetrics;
} {
  const poolK = options.candidatePoolK ?? EVAL_CANDIDATE_POOL_K;
  const { candidateStage, finalStage } = runNoteSemanticPipeline({
    candidates: queryCase.candidates,
    candidatePoolK: poolK,
    minSimilarity: options.minSimilarity,
  });

  const candidateStageIds = candidateResultIds(candidateStage);
  const finalStageIds = finalResultIds(finalStage);

  const metrics = computeRetrievalMetrics({
    finalRankedIds: finalStageIds,
    candidateRankedIds: candidateStageIds,
    relevantIds: queryCase.relevantIds,
    k: options.evalK,
  });

  return { candidateStageIds, finalStageIds, metrics };
}

export function compareThresholdsForQuery(
  queryCase: EvalQueryCase,
  thresholds: readonly number[],
  evalK: number,
  candidatePoolK?: number,
): ThresholdComparisonRow[] {
  return thresholds.map((threshold) => ({
    queryId: queryCase.id,
    threshold,
    metrics: evaluateQueryCase(queryCase, {
      minSimilarity: threshold,
      evalK,
      candidatePoolK,
    }).metrics,
  }));
}

export function formatThresholdTable(rows: ThresholdComparisonRow[]): string {
  const header =
    "queryId\tthreshold\tprecision@K\trecall@K\tf1\tcandidateRecall@K\treturnedCount";
  const lines = rows.map((row) => {
    const m = row.metrics;
    const recall = m.recallAtK === null ? "n/a" : m.recallAtK.toFixed(4);
    const f1 = m.f1 === null ? "n/a" : m.f1.toFixed(4);
    const cRecall =
      m.candidateRecallAtK === null ? "n/a" : m.candidateRecallAtK.toFixed(4);
    return [
      row.queryId,
      row.threshold.toFixed(2),
      m.precisionAtK.toFixed(4),
      recall,
      f1,
      cRecall,
      String(m.returnedCount),
    ].join("\t");
  });
  return [header, ...lines].join("\n");
}
