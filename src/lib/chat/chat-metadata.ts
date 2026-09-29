import { z } from "zod";

import type { ChatAnswerOutcome } from "@/lib/chat/chat-outcomes";
import type { AskVaultSource } from "@/lib/rag/types";

const AskVaultSourceSchema = z.object({
  noteId: z.string(),
  title: z.string(),
  categoryName: z.string().nullable(),
  type: z.string(),
});

const AssistantMetadataSchema = z.object({
  sources: z.array(AskVaultSourceSchema).optional(),
  outcome: z
    .enum(["answered", "answered_from_grounded_history", "no_relevant_knowledge"])
    .optional(),
  groundedFromMessageId: z.string().optional(),
});

export type AssistantMessageMetadata = {
  sources?: AskVaultSource[];
  outcome?: ChatAnswerOutcome;
  groundedFromMessageId?: string;
};

export function parseAssistantMetadata(raw: unknown): AssistantMessageMetadata {
  const parsed = AssistantMetadataSchema.safeParse(raw);
  if (!parsed.success) {
    return {};
  }
  return parsed.data;
}

export function buildAssistantMetadata(
  sources: AskVaultSource[],
  outcome: ChatAnswerOutcome = "answered",
  groundedFromMessageId?: string,
): AssistantMessageMetadata {
  return {
    sources,
    outcome,
    ...(groundedFromMessageId ? { groundedFromMessageId } : {}),
  };
}
