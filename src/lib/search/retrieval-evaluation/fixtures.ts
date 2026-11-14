import type { ScoredCandidate } from "./pipeline";

export type EvalQueryCase = {
  id: string;
  description: string;
  /** Full eligible corpus for this query (synthetic similarities). */
  candidates: ScoredCandidate[];
  /** Ground-truth relevant note ids. */
  relevantIds: string[];
};

const OPENMAIC_ID = "openmaic-note";

/** Regression from local measurement: rank 1, similarity 0.451, threshold 0.6 excludes. */
export const openmaicMeasuredCandidates: ScoredCandidate[] = [
  { id: OPENMAIC_ID, similarity: 0.451166 },
  { id: "note-ai-notes", similarity: 0.346096 },
  { id: "note-safety", similarity: 0.250884 },
  { id: "note-nestjs", similarity: 0.2456 },
  { id: "note-ai-engineer", similarity: 0.202854 },
  { id: "note-06", similarity: 0.18 },
  { id: "note-07", similarity: 0.17 },
  { id: "note-08", similarity: 0.16 },
  { id: "note-09", similarity: 0.15 },
  { id: "note-10", similarity: 0.14 },
  { id: "note-11", similarity: 0.13 },
  { id: "note-12", similarity: 0.12 },
  { id: "note-13", similarity: 0.11 },
  { id: "note-14", similarity: 0.1 },
  { id: "note-15", similarity: 0.09 },
];

export const openmaicRegressionCase: EvalQueryCase = {
  id: "openmaic-threshold-regression",
  description:
    "Synthetic replay of measured OpenMAIC query (relevant at 0.451, rank 1/15, excluded at 0.60).",
  candidates: openmaicMeasuredCandidates,
  relevantIds: [OPENMAIC_ID],
};

export const evalFixtureCases: EvalQueryCase[] = [
  openmaicRegressionCase,
  {
    id: "strong-single-hit",
    description: "One clearly relevant note above threshold.",
    candidates: [
      { id: "rel-a", similarity: 0.82 },
      { id: "noise-1", similarity: 0.4 },
      { id: "noise-2", similarity: 0.35 },
    ],
    relevantIds: ["rel-a"],
  },
  {
    id: "partially-relevant-mixed",
    description: "Two relevant; one high, one borderline.",
    candidates: [
      { id: "rel-high", similarity: 0.71 },
      { id: "rel-low", similarity: 0.55 },
      { id: "noise", similarity: 0.3 },
    ],
    relevantIds: ["rel-high", "rel-low"],
  },
  {
    id: "multi-relevant-top",
    description: "Two relevant notes in top positions.",
    candidates: [
      { id: "rel-1", similarity: 0.68 },
      { id: "rel-2", similarity: 0.67 },
      { id: "noise", similarity: 0.2 },
    ],
    relevantIds: ["rel-1", "rel-2"],
  },
  {
    id: "no-relevant-labeled",
    description: "Retrieval returns items but labels say none relevant.",
    candidates: [
      { id: "a", similarity: 0.8 },
      { id: "b", similarity: 0.7 },
    ],
    relevantIds: [],
  },
  {
    id: "no-returns-after-threshold",
    description: "All similarities below 0.6.",
    candidates: [
      { id: "a", similarity: 0.59 },
      { id: "b", similarity: 0.45 },
    ],
    relevantIds: ["a"],
  },
  {
    id: "similarity-ties",
    description: "Tie on similarity; stable id tie-break.",
    candidates: [
      { id: "b", similarity: 0.75 },
      { id: "a", similarity: 0.75 },
      { id: "rel", similarity: 0.75 },
    ],
    relevantIds: ["rel"],
  },
  {
    id: "duplicate-ids",
    description: "Duplicate candidate rows; first in rank order kept.",
    candidates: [
      { id: "dup", similarity: 0.9 },
      { id: "dup", similarity: 0.85 },
      { id: "rel", similarity: 0.7 },
    ],
    relevantIds: ["rel"],
  },
  {
    id: "pool-larger-than-corpus",
    description: "Fewer than K notes in vault.",
    candidates: [
      { id: "only", similarity: 0.65 },
    ],
    relevantIds: ["only"],
  },
];

export const DEFAULT_THRESHOLD_SWEEP = [0.6, 0.5, 0.4, 0.3] as const;
