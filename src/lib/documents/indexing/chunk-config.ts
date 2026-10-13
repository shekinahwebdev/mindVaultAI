/** Approximate tokens as characters / 4 when no tokenizer is available. */
export const CHARS_PER_TOKEN_ESTIMATE = 4;

export type ChunkingConfig = {
  /** Target chunk size in characters (~600 tokens at CHARS_PER_TOKEN_ESTIMATE). */
  targetChars: number;
  /** Hard maximum chunk size in characters (~800 tokens). */
  maxChars: number;
  /** Overlap between consecutive chunks in characters (~100 tokens). */
  overlapChars: number;
};

/** ~600 / ~800 / ~100 tokens via characters ÷ 4 (no tokenizer in-app). */
export const DEFAULT_CHUNKING_CONFIG: ChunkingConfig = {
  targetChars: 2_400,
  maxChars: 3_200,
  overlapChars: 400,
};
