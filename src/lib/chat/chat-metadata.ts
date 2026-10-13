import { z } from "zod";

import type { ChatAnswerOutcome } from "@/lib/chat/chat-outcomes";
import type { AskVaultSource } from "@/lib/rag/types";

const LegacyNoteSourceSchema = z.object({
  noteId: z.string(),
  title: z.string(),
  categoryName: z.string().nullable(),
  type: z.string(),
});

const NoteSourceSchema = LegacyNoteSourceSchema.extend({
  kind: z.literal("note").optional(),
});

const DocumentSourceSchema = z.object({
  kind: z.literal("document"),
  documentId: z.string(),
  chunkId: z.string(),
  title: z.string(),
  pageStart: z.number().int(),
  pageEnd: z.number().int(),
});

const AskVaultSourceSchema = z.union([NoteSourceSchema, DocumentSourceSchema]);

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

function normalizeSource(raw: z.infer<typeof AskVaultSourceSchema>): AskVaultSource {
  if ("documentId" in raw && raw.kind === "document") {
    return {
      kind: "document",
      documentId: raw.documentId,
      chunkId: raw.chunkId,
      title: raw.title,
      pageStart: raw.pageStart,
      pageEnd: raw.pageEnd,
    };
  }
  return {
    kind: "note",
    noteId: raw.noteId,
    title: raw.title,
    categoryName: raw.categoryName,
    type: raw.type,
  };
}

export function parseAssistantMetadata(raw: unknown): AssistantMessageMetadata {
  const parsed = AssistantMetadataSchema.safeParse(raw);
  if (!parsed.success) {
    return {};
  }
  return {
    ...parsed.data,
    sources: parsed.data.sources?.map(normalizeSource),
  };
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
