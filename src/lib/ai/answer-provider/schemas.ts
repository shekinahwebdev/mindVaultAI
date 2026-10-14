import { z } from "zod";

export const RagAnswerSchema = z.object({
  answer: z.string(),
  sourceNumbers: z.array(z.number()),
});

export const GroundedHistoryAnswerSchema = z.object({
  answer: z.string(),
});

export type ParsedRagAnswer = z.infer<typeof RagAnswerSchema>;
