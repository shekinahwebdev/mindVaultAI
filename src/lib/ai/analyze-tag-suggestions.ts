import {
  normalizeTagDisplayName,
  normalizeTagName,
} from "@/lib/tags/tag-normalization";
import { validateTagName } from "@/lib/tags/tag-validation";

/** Max tag names sent to Gemini (most-used first, then name). */
export const TAG_NAMES_FOR_AI_CAP = 150;

/** Max combined existing + new suggestions returned to the client. */
export const MAX_AI_TAG_SUGGESTIONS = 5;

export type UserTagForAnalysis = {
  id: string;
  name: string;
  normalizedName: string;
};

export type RawAiTagSuggestion = {
  existing?: string[];
  suggested?: string[];
};

export type ValidatedTagSuggestions = {
  existing: Array<{ id: string; name: string }>;
  new: string[];
};

export function validateAnalysisTagSuggestions(
  raw: RawAiTagSuggestion | undefined,
  userTags: UserTagForAnalysis[],
  selectedTagIds: string[] = [],
): ValidatedTagSuggestions {
  const byNormalized = new Map<string, UserTagForAnalysis>();
  for (const tag of userTags) {
    byNormalized.set(tag.normalizedName, tag);
  }

  const selectedNormalized = new Set<string>();
  for (const id of selectedTagIds) {
    const tag = userTags.find((item) => item.id === id);
    if (tag) {
      selectedNormalized.add(tag.normalizedName);
    }
  }

  const existing: Array<{ id: string; name: string }> = [];
  const newNames: string[] = [];
  const seenNormalized = new Set<string>();

  const existingRaw = Array.isArray(raw?.existing) ? raw.existing : [];
  const suggestedRaw = Array.isArray(raw?.suggested) ? raw.suggested : [];

  for (const item of existingRaw) {
    if (typeof item !== "string") {
      continue;
    }
    const key = normalizeTagName(item);
    if (!key || seenNormalized.has(key) || selectedNormalized.has(key)) {
      continue;
    }
    const match = byNormalized.get(key);
    if (!match) {
      continue;
    }
    seenNormalized.add(key);
    existing.push({ id: match.id, name: match.name });
    if (existing.length + newNames.length >= MAX_AI_TAG_SUGGESTIONS) {
      return { existing, new: newNames };
    }
  }

  for (const item of suggestedRaw) {
    if (typeof item !== "string") {
      continue;
    }
    if (validateTagName(item)) {
      continue;
    }
    const key = normalizeTagName(item);
    if (!key || seenNormalized.has(key) || selectedNormalized.has(key)) {
      continue;
    }
    if (byNormalized.has(key)) {
      const match = byNormalized.get(key)!;
      if (!existing.some((tag) => tag.id === match.id)) {
        seenNormalized.add(key);
        existing.push({ id: match.id, name: match.name });
      }
      continue;
    }
    seenNormalized.add(key);
    newNames.push(normalizeTagDisplayName(item));
    if (existing.length + newNames.length >= MAX_AI_TAG_SUGGESTIONS) {
      break;
    }
  }

  return { existing, new: newNames };
}
