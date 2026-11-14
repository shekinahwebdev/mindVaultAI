import { z } from "zod";

import { NoteType } from "@/generated/prisma/enums";

import type { NoteAnalysisInput } from "./types";

export const NOTE_ANALYZE_MODEL_DEFAULT = "gpt-4o-mini";

export const NOTE_TYPE_VALUES = Object.values(NoteType) as [NoteType, ...NoteType[]];

export const NoteAnalysisSchema = z.object({
  title: z.string(),
  type: z.enum(NOTE_TYPE_VALUES),
  category: z.string().nullable(),
  tags: z
    .object({
      existing: z.array(z.string()).default([]),
      suggested: z.array(z.string()).default([]),
    })
    .default({ existing: [], suggested: [] }),
});

export type ParsedNoteAnalysis = z.infer<typeof NoteAnalysisSchema>;

export const NOTE_ANALYSIS_JSON_SCHEMA = {
  name: "mindvault_note_analysis",
  strict: true,
  schema: {
    type: "object",
    properties: {
      title: { type: "string" },
      type: { type: "string", enum: NOTE_TYPE_VALUES },
      category: {
        anyOf: [{ type: "string" }, { type: "null" }],
      },
      tags: {
        type: "object",
        properties: {
          existing: { type: "array", items: { type: "string" } },
          suggested: { type: "array", items: { type: "string" } },
        },
        required: ["existing", "suggested"],
        additionalProperties: false,
      },
    },
    required: ["title", "type", "category", "tags"],
    additionalProperties: false,
  },
} as const;

export const NOTE_ANALYSIS_SYSTEM_INSTRUCTION = `You are the knowledge organization component of MindVault, a personal knowledge vault.

Given content supplied by the user, you will:
1. Generate a concise, useful title for it.
2. Classify it into exactly one of the allowed note types.
3. Choose the single most appropriate category from the user's existing categories.
4. Suggest up to five concise tags that describe the content.

Allowed note types: NOTE, LINK, QUOTE, CODE, ARTICLE, OTHER.

Rules:
- The title must be concise. Do not invent facts that are not present in the content.
- Do not rewrite, paraphrase, or summarize the user's content itself — only use it to choose a title, type, category, and tags.
- Strongly prefer an existing category from the list provided over inventing a new one.
- If none of the existing categories clearly fit, return null for category. Never force an unrelated category.
- For tags: prefer names from the user's existing tag list whenever they accurately describe the content. Do not force an irrelevant existing tag.
- Put matching existing tag names in tags.existing. Put genuinely useful new tag names (not already in the list) in tags.suggested.
- Avoid near-duplicates, overly broad tags, keyword spam, and one-off phrases. At most five tags total across existing and suggested combined.
- Return only the requested structured fields. Do not include explanations.`;

export function buildNoteAnalysisUserMessage({
  content,
  categoryNames,
  tagNames,
}: NoteAnalysisInput): string {
  const categoriesLine =
    categoryNames.length > 0
      ? `Existing categories: ${categoryNames.join(", ")}`
      : "Existing categories: (none yet)";

  const tagsLine =
    tagNames.length > 0 ? `Existing tags: ${tagNames.join(", ")}` : "Existing tags: (none yet)";

  return `${categoriesLine}\n${tagsLine}\n\nContent to analyze:\n"""\n${content}\n"""`;
}

export function parseNoteAnalysisSuggestion(text: string | undefined): ParsedNoteAnalysis | null {
  if (!text) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }

  const result = NoteAnalysisSchema.safeParse(parsed);
  return result.success ? result.data : null;
}

export function getOpenAiAnalyzeModel(): string {
  return (
    process.env.OPENAI_ANALYZE_MODEL?.trim() ||
    process.env.OPENAI_ANSWER_MODEL?.trim() ||
    NOTE_ANALYZE_MODEL_DEFAULT
  );
}
