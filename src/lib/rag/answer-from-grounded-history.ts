import { getAnswerProvider } from "@/lib/ai/answer-provider";
import type { GroundedHistoryGenerationInput } from "@/lib/ai/answer-provider/input-types";

import type { AnswerQuestionMeta } from "./types";

export type AnswerFromGroundedHistoryInput = GroundedHistoryGenerationInput;

export type AnswerFromGroundedHistoryResult =
  | { ok: true; answer: string; meta: AnswerQuestionMeta }
  | {
      ok: false;
      reason: "timeout" | "rate_limit" | "provider_error" | "invalid_output";
      meta: Pick<AnswerQuestionMeta, "model" | "latencyMs">;
    };

export async function answerFromGroundedHistory(
  input: AnswerFromGroundedHistoryInput,
): Promise<AnswerFromGroundedHistoryResult> {
  return getAnswerProvider().generateGroundedFollowUp(input);
}
