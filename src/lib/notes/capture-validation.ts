import { NoteType } from "@/generated/prisma/enums";

export type CaptureFormValues = {
  content: string;
  title: string;
  type: string;
  sourceUrl: string;
  categoryId: string;
};

export type CaptureFieldErrors = Partial<Record<keyof CaptureFormValues, string>>;

export type CaptureCreatePayload = {
  title: string;
  content: string;
  type: (typeof NoteType)[keyof typeof NoteType];
  sourceUrl: string | null;
  categoryId: string | null;
};

const NOTE_TYPES = new Set<string>(Object.values(NoteType));
const MAX_TITLE_LENGTH = 500;
const MAX_CONTENT_LENGTH = 100_000;
const MAX_SOURCE_URL_LENGTH = 2048;

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateCaptureForm(values: CaptureFormValues):
  | { success: true; data: CaptureCreatePayload }
  | { success: false; errors: CaptureFieldErrors } {
  const errors: CaptureFieldErrors = {};
  const title = values.title.trim();
  const content = values.content;
  const type = values.type || NoteType.NOTE;
  const sourceUrl = values.sourceUrl.trim();
  const categoryId = values.categoryId.trim();

  if (!title) {
    errors.title = "Title is required.";
  } else if (title.length > MAX_TITLE_LENGTH) {
    errors.title = `Title must be at most ${MAX_TITLE_LENGTH} characters.`;
  }

  if (!content.trim()) {
    errors.content = "Content is required.";
  } else if (content.length > MAX_CONTENT_LENGTH) {
    errors.content = `Content must be at most ${MAX_CONTENT_LENGTH} characters.`;
  }

  if (!type) {
    errors.type = "Type is required.";
  } else if (!NOTE_TYPES.has(type)) {
    errors.type = "Type must be a valid note type.";
  }

  if (sourceUrl) {
    if (sourceUrl.length > MAX_SOURCE_URL_LENGTH) {
      errors.sourceUrl = `Source URL must be at most ${MAX_SOURCE_URL_LENGTH} characters.`;
    } else if (!isValidUrl(sourceUrl)) {
      errors.sourceUrl = "Source URL must be a valid http or https URL.";
    }
  }

  if (categoryId && !categoryId.trim()) {
    errors.categoryId = "Category ID must be a non-empty string.";
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      title,
      content,
      type: type as CaptureCreatePayload["type"],
      sourceUrl: sourceUrl || null,
      categoryId: categoryId || null,
    },
  };
}

export function captureFormIsDirty(values: CaptureFormValues) {
  return (
    values.content.trim().length > 0 ||
    values.title.trim().length > 0 ||
    values.sourceUrl.trim().length > 0 ||
    values.categoryId.trim().length > 0 ||
    values.type !== NoteType.NOTE
  );
}

export function noteValuesFromSerialized(note: {
  title: string;
  content: string;
  type: string;
  sourceUrl: string | null;
  categoryId: string | null;
}): CaptureFormValues {
  return {
    title: note.title,
    content: note.content,
    type: note.type,
    sourceUrl: note.sourceUrl ?? "",
    categoryId: note.categoryId ?? "",
  };
}

export function noteEditFormIsDirty(
  original: CaptureFormValues,
  current: CaptureFormValues,
) {
  return (
    original.title !== current.title ||
    original.content !== current.content ||
    original.type !== current.type ||
    original.sourceUrl !== current.sourceUrl ||
    original.categoryId !== current.categoryId
  );
}

export const NOTE_EDIT_DISCARD_CONFIRM =
  "Discard your changes? Unsaved edits will be lost.";

export const NOTE_UPDATE_SUCCESS = "Updated in your vault.";
export const NOTE_DELETE_SUCCESS = "Removed from your vault.";
export const NOTE_DETAIL_LOAD_ERROR =
  "Could not load this note. Please try again.";
export const NOTE_UPDATE_ERROR = "Something went wrong. Please try again.";
export const NOTE_DELETE_ERROR = "Something went wrong. Please try again.";
export const NOTE_NOT_FOUND_MESSAGE = "Note not found.";
