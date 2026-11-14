import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { RAG_MIN_SIMILARITY } from "@/lib/rag/select-evidence";

import {
  DEFAULT_THRESHOLD_SWEEP,
  evalFixtureCases,
  openmaicRegressionCase,
} from "./fixtures";
import {
  candidateRecallAtK,
  computeRetrievalMetrics,
  f1Score,
  precisionAtK,
  recallAtK,
} from "./metrics";
import {
  applyCandidatePool,
  EVAL_CANDIDATE_POOL_K,
  rankCandidatesBySimilarity,
  runNoteSemanticPipeline,
} from "./pipeline";
import {
  compareThresholdsForQuery,
  evaluateQueryCase,
  formatThresholdTable,
} from "./run-threshold-comparison";

const EVAL_K = 5;

describe("retrieval evaluation metrics", () => {
  it("computes precision@K", () => {
    assert.equal(precisionAtK(["a", "b", "c"], new Set(["a", "c"]), 3), 2 / 3);
    assert.equal(precisionAtK([], new Set(["a"]), 5), 0);
    assert.equal(precisionAtK(["x"], new Set(["y"]), 3), 0);
  });

  it("computes recall@K", () => {
    assert.equal(recallAtK(["a", "b", "x"], new Set(["a", "b"]), 2), 1);
    assert.equal(recallAtK(["a"], new Set(["a", "b"]), 5), 0.5);
    assert.equal(recallAtK(["a"], [], 5), null);
  });

  it("computes F1", () => {
    assert.equal(f1Score(0.8, 0.5), (2 * 0.8 * 0.5) / (0.8 + 0.5));
    assert.equal(f1Score(0, 0), 0);
    assert.equal(f1Score(0.5, null), null);
  });

  it("computes candidate recall@K separately from final recall", () => {
    const finalIds: string[] = [];
    const candidateIds = ["rel", "noise"];
    assert.equal(candidateRecallAtK(candidateIds, ["rel"], 5), 1);
    assert.equal(recallAtK(finalIds, ["rel"], 5), 0);
  });
});

describe("retrieval evaluation pipeline", () => {
  it("applies candidate pool before threshold", () => {
    const ranked = rankCandidatesBySimilarity(
      Array.from({ length: 30 }, (_, i) => ({
        id: `n${i}`,
        similarity: 1 - i * 0.01,
      })),
    );
    assert.equal(applyCandidatePool(ranked, 24).length, 24);
  });

  it("filters by threshold on candidate stage only", () => {
    const result = runNoteSemanticPipeline({
      candidates: [
        { id: "high", similarity: 0.7 },
        { id: "low", similarity: 0.45 },
      ],
      candidatePoolK: 24,
      minSimilarity: 0.6,
    });
    assert.equal(result.candidateStage.length, 2);
    assert.equal(result.finalStage.length, 1);
    assert.equal(result.finalStage[0]!.id, "high");
  });

  it("breaks similarity ties by id", () => {
    const ranked = rankCandidatesBySimilarity([
      { id: "b", similarity: 0.75 },
      { id: "a", similarity: 0.75 },
    ]);
    assert.deepEqual(
      ranked.map((r) => r.id),
      ["a", "b"],
    );
  });

  it("dedupes duplicate ids for pool", () => {
    const result = runNoteSemanticPipeline({
      candidates: [
        { id: "dup", similarity: 0.9 },
        { id: "dup", similarity: 0.95 },
        { id: "other", similarity: 0.5 },
      ],
      candidatePoolK: 10,
      minSimilarity: 0,
    });
    assert.equal(result.candidateStage.length, 2);
    assert.equal(result.candidateStage[0]!.id, "dup");
    assert.equal(result.candidateStage[0]!.similarity, 0.95);
  });

  it("uses production-aligned default pool size", () => {
    assert.equal(EVAL_CANDIDATE_POOL_K, 24);
    assert.equal(RAG_MIN_SIMILARITY, 0.6);
  });
});

describe("retrieval evaluation fixtures", () => {
  it("openMAIC regression: rank 1 in candidates, empty final at 0.60", () => {
    const evaluated = evaluateQueryCase(openmaicRegressionCase, {
      minSimilarity: 0.6,
      evalK: EVAL_K,
    });
    assert.equal(evaluated.candidateStageIds[0], "openmaic-note");
    assert.equal(evaluated.finalStageIds.length, 0);
    assert.equal(evaluated.metrics.candidateRecallAtK, 1);
    assert.equal(evaluated.metrics.recallAtK, 0);
    assert.equal(evaluated.metrics.precisionAtK, 0);
    assert.equal(evaluated.metrics.returnedCount, 0);
  });

  it("handles empty result sets and no relevant labels", () => {
    const noLabels = evalFixtureCases.find((c) => c.id === "no-relevant-labeled")!;
    const metrics = evaluateQueryCase(noLabels, { minSimilarity: 0.6, evalK: 3 }).metrics;
    assert.equal(metrics.recallAtK, null);
    assert.equal(metrics.f1, null);

    const below = evalFixtureCases.find((c) => c.id === "no-returns-after-threshold")!;
    const belowMetrics = evaluateQueryCase(below, { minSimilarity: 0.6, evalK: 3 }).metrics;
    assert.equal(belowMetrics.returnedCount, 0);
    assert.equal(belowMetrics.recallAtK, 0);
  });

  it("evaluates all fixture cases without throwing", () => {
    for (const queryCase of evalFixtureCases) {
      evaluateQueryCase(queryCase, { minSimilarity: 0.6, evalK: EVAL_K });
    }
  });
});

describe("threshold comparison (synthetic)", () => {
  it("openMAIC: only sub-0.60 thresholds return results", () => {
    const rows = compareThresholdsForQuery(
      openmaicRegressionCase,
      DEFAULT_THRESHOLD_SWEEP,
      EVAL_K,
    );
    const byThreshold = new Map(rows.map((r) => [r.threshold, r.metrics]));
    assert.equal(byThreshold.get(0.6)!.returnedCount, 0);
    assert.equal(byThreshold.get(0.5)!.returnedCount, 0);
    assert.equal(byThreshold.get(0.4)!.returnedCount, 1);
    assert.equal(byThreshold.get(0.3)!.returnedCount, 2);
    assert.equal(byThreshold.get(0.4)!.recallAtK, 1);
    assert.equal(byThreshold.get(0.4)!.precisionAtK, 1 / EVAL_K);
  });

  it("produces formatted table output", () => {
    const rows = compareThresholdsForQuery(
      openmaicRegressionCase,
      DEFAULT_THRESHOLD_SWEEP,
      EVAL_K,
    );
    const table = formatThresholdTable(rows);
    assert.match(table, /openmaic-threshold-regression/);
    assert.match(table, /0\.60/);
  });
});

describe("computeRetrievalMetrics integration", () => {
  it("reports counts for multi-relevant case", () => {
    const multi = evalFixtureCases.find((c) => c.id === "multi-relevant-top")!;
    const { metrics } = evaluateQueryCase(multi, { minSimilarity: 0.6, evalK: 2 });
    assert.equal(metrics.returnedCount, 2);
    assert.equal(metrics.recallAtK, 1);
    assert.equal(metrics.precisionAtK, 1);
    assert.equal(metrics.f1, 1);
  });
});
