/**
 * Conservative heuristic for "rewrite/clarify the last sourced answer" follow-ups.
 * False negatives are acceptable; false positives would widen general-knowledge risk.
 *
 * Limitations: may miss valid follow-ups phrased as new sentences without referential
 * words; may reject long but legitimate clarifications (>160 chars).
 */

const MAX_FOLLOW_UP_LENGTH = 160;

const REFERENTIAL =
  /\b(that|this|it|those|these|previous|prior|last|second|third|first|above|earlier)\b/i;

const FOLLOW_UP_INTENT =
  /\b(explain|summarize|summarise|simplify|shorter|shorten|clarify|elaborate|rephrase|restate|mean|meant|points?|bullet|bullets|takeaways?|important)\b/i;

/** Standalone new-topic questions — not eligible even after a grounded turn. */
const NEW_TOPIC_START =
  /^(what is|who is|who was|who are|what's|how do i|how to|tell me about|write me|write a|create a|make me|give me a poem|what's the weather)\b/i;

const STRONG_FOLLOW_UP_PHRASES =
  /\b(what did you mean|more simply|in \d+ bullet|key points|make that shorter|even shorter|the last part|second point)\b/i;

export function isLikelyGroundedFollowUp(question: string): boolean {
  const q = question.trim();
  if (q.length < 3 || q.length > MAX_FOLLOW_UP_LENGTH) {
    return false;
  }

  if (NEW_TOPIC_START.test(q)) {
    return false;
  }

  if (STRONG_FOLLOW_UP_PHRASES.test(q)) {
    return true;
  }

  const hasReferential = REFERENTIAL.test(q);
  const hasIntent = FOLLOW_UP_INTENT.test(q);

  if (hasReferential && hasIntent) {
    return true;
  }

  if (hasReferential && /^(can you|could you|please)\b/i.test(q)) {
    return true;
  }

  if (hasIntent && q.length <= 64 && /\?$/.test(q)) {
    return true;
  }

  return false;
}
