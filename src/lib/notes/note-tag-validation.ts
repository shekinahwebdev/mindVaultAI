import { MAX_TAGS_PER_NOTE } from "./note-tag-limits";

export const NOTE_TAG_NOT_FOUND = "Tag not found.";

export function parseNoteTagIds(value: unknown):
  | { success: true; tagIds: string[] }
  | { success: false; message: string } {
  if (!Array.isArray(value)) {
    return { success: false, message: "tagIds must be an array." };
  }

  const tagIds: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") {
      return { success: false, message: "Each tag ID must be a string." };
    }
    const trimmed = item.trim();
    if (!trimmed) {
      return { success: false, message: "Each tag ID must be a non-empty string." };
    }
    tagIds.push(trimmed);
  }

  const unique = [...new Set(tagIds)];
  if (unique.length > MAX_TAGS_PER_NOTE) {
    return {
      success: false,
      message: `A note can have at most ${MAX_TAGS_PER_NOTE} tags.`,
    };
  }

  return { success: true, tagIds: unique };
}
