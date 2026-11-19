/**
 * Offline threshold sweep (synthetic scores). No API calls, no DB writes.
 *
 * Usage: npx tsx scripts/eval-retrieval-thresholds.ts
 */
import {
  compareThresholdsForQuery,
  DEFAULT_THRESHOLD_SWEEP,
  formatThresholdTable,
  openmaicRegressionCase,
} from "../src/lib/search/retrieval-evaluation";

const EVAL_K = Number.parseInt(process.env.EVAL_K ?? "5", 10);

const rows = compareThresholdsForQuery(
  openmaicRegressionCase,
  DEFAULT_THRESHOLD_SWEEP,
  Number.isFinite(EVAL_K) && EVAL_K > 0 ? EVAL_K : 5,
);

console.log(formatThresholdTable(rows));
