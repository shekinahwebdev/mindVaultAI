import { NoteType } from "@/generated/prisma/enums";

import type { NoteAnalysisSuggestion } from "@/lib/ai/types";

const NOTE_TYPES = new Set<string>(Object.values(NoteType));
const MAX_TITLE_LENGTH = 500;
const MAX_CONTENT_LENGTH = 100_000;
export const ANALYZE_MIN_CONTENT_LENGTH = 20;

export const ANALYZE_INVALID_REQUEST = "Invalid request.";
export const ANALYZE_CONTENT_TOO_SHORT =
  "Add a bit more content before analyzing.";
export const ANALYZE_SERVER_ERROR =
  "MindVault couldn't analyze this right now. You can still organize and save it manually.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseAnalyzeRequestBody(
  body: unknown,
): { success: true; content: string } | { success: false; message: string } {
  if (!isRecord(body) || typeof body.content !== "string") {
    return { success: false, message: ANALYZE_INVALID_REQUEST };
  }

  const content = body.content;

  if (content.length > MAX_CONTENT_LENGTH) {
    return { success: false, message: ANALYZE_INVALID_REQUEST };
  }

  if (content.trim().length < ANALYZE_MIN_CONTENT_LENGTH) {
    return { success: false, message: ANALYZE_CONTENT_TOO_SHORT };
  }

  return { success: true, content };
}

export type ValidatedSuggestion = {
  title: string;
  type: NoteType;
  categoryId: string | null;
};

/**
 * The model's output is untrusted: a type outside the enum falls back to the
 * app default, and a category name that doesn't match one of the user's own
 * categories is dropped rather than persisted.
 */
export function validateAnalysisSuggestion(
  suggestion: NoteAnalysisSuggestion,
  userCategories: Array<{ id: string; name: string }>,
): ValidatedSuggestion {
  const title = suggestion.title.trim().slice(0, MAX_TITLE_LENGTH);

  const type = NOTE_TYPES.has(suggestion.type) ? suggestion.type : NoteType.NOTE;

  let categoryId: string | null = null;
  if (suggestion.category) {
    const normalized = suggestion.category.trim().toLowerCase();
    const match = userCategories.find(
      (category) => category.name.toLowerCase() === normalized,
    );
    categoryId = match?.id ?? null;
  }

  return { title, type, categoryId };
}
