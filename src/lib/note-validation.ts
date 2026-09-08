import { NoteType } from "@/generated/prisma/client";

import {
  NOTE_SORT_OPTIONS,
  UNCategorized_CATEGORY_FILTER,
  type NoteSortOption,
} from "@/lib/notes/notes-list-config";

export type { NoteSortOption };
export { NOTE_SORT_OPTIONS, UNCategorized_CATEGORY_FILTER };

export type CreateNotePayload = {
  title: string;
  content: string;
  type: NoteType;
  sourceUrl: string | null;
  categoryId: string | null;
};

export type UpdateNotePayload = {
  title?: string;
  content?: string;
  type?: NoteType;
  sourceUrl?: string | null;
  categoryId?: string | null;
};

export type CreateNoteValues = {
  title: string;
  content: string;
  type: string;
  sourceUrl: string;
  categoryId: string;
};

export type UpdateNoteValues = {
  title: string;
  content: string;
  type: string;
  sourceUrl: string;
  categoryId: string;
};

export type NoteFieldErrors<T> = Partial<Record<keyof T, string>>;

const NOTE_TYPES = new Set<string>(Object.values(NoteType));
const MAX_TITLE_LENGTH = 500;
const MAX_CONTENT_LENGTH = 100_000;
const MAX_SOURCE_URL_LENGTH = 2048;

export const NOTE_NOT_FOUND = "Note not found.";
export const NOTE_SERVER_ERROR = "Something went wrong. Please try again.";
export const CATEGORY_NOT_FOUND = "Category not found.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function validateTitle(title: string): string | undefined {
  if (!title) {
    return "Title is required.";
  }
  if (title.length > MAX_TITLE_LENGTH) {
    return `Title must be at most ${MAX_TITLE_LENGTH} characters.`;
  }
  return undefined;
}

function validateContent(content: string): string | undefined {
  if (!content.trim()) {
    return "Content is required.";
  }
  if (content.length > MAX_CONTENT_LENGTH) {
    return `Content must be at most ${MAX_CONTENT_LENGTH} characters.`;
  }
  return undefined;
}

function validateNoteType(type: string): string | undefined {
  if (!type) {
    return "Type is required.";
  }
  if (!NOTE_TYPES.has(type)) {
    return "Type must be a valid note type.";
  }
  return undefined;
}

function validateSourceUrl(sourceUrl: string): string | undefined {
  if (!sourceUrl) {
    return undefined;
  }
  if (sourceUrl.length > MAX_SOURCE_URL_LENGTH) {
    return `Source URL must be at most ${MAX_SOURCE_URL_LENGTH} characters.`;
  }
  if (!isValidUrl(sourceUrl)) {
    return "Source URL must be a valid http or https URL.";
  }
  return undefined;
}

function validateCategoryId(categoryId: string): string | undefined {
  if (!categoryId.trim()) {
    return "Category ID must be a non-empty string.";
  }
  return undefined;
}

function parseOptionalString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function parseOptionalNullableString(
  value: unknown,
): string | null | undefined {
  if (value === null) {
    return null;
  }
  if (typeof value === "string") {
    return value;
  }
  return undefined;
}

export function parseCreateNoteBody(body: unknown):
  | { success: true; data: CreateNotePayload }
  | { success: false; errors: NoteFieldErrors<CreateNoteValues> } {
  if (!isRecord(body)) {
    return {
      success: false,
      errors: { title: "Invalid request." },
    };
  }

  const values: CreateNoteValues = {
    title: parseOptionalString(body.title),
    content: parseOptionalString(body.content),
    type: parseOptionalString(body.type) || NoteType.NOTE,
    sourceUrl: parseOptionalString(body.sourceUrl),
    categoryId: parseOptionalString(body.categoryId),
  };

  const errors: NoteFieldErrors<CreateNoteValues> = {};

  const titleError = validateTitle(values.title.trim());
  if (titleError) {
    errors.title = titleError;
  }

  const contentError = validateContent(values.content);
  if (contentError) {
    errors.content = contentError;
  }

  const typeError = validateNoteType(values.type);
  if (typeError) {
    errors.type = typeError;
  }

  if (body.sourceUrl !== undefined && body.sourceUrl !== null) {
    const sourceUrlError = validateSourceUrl(values.sourceUrl.trim());
    if (sourceUrlError) {
      errors.sourceUrl = sourceUrlError;
    }
  }

  if (body.categoryId !== undefined && body.categoryId !== null) {
    const categoryIdError = validateCategoryId(values.categoryId);
    if (categoryIdError) {
      errors.categoryId = categoryIdError;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      title: values.title.trim(),
      content: values.content,
      type: values.type as NoteType,
      sourceUrl:
        body.sourceUrl === undefined || body.sourceUrl === null
          ? null
          : values.sourceUrl.trim(),
      categoryId:
        body.categoryId === undefined || body.categoryId === null
          ? null
          : values.categoryId.trim(),
    },
  };
}

export function parseUpdateNoteBody(body: unknown):
  | { success: true; data: UpdateNotePayload }
  | { success: false; errors: NoteFieldErrors<UpdateNoteValues> } {
  if (!isRecord(body)) {
    return {
      success: false,
      errors: { title: "Invalid request." },
    };
  }

  const forbiddenFields = ["userId", "id", "createdAt", "updatedAt"] as const;
  for (const field of forbiddenFields) {
    if (field in body) {
      return {
        success: false,
        errors: { title: "Invalid request." },
      };
    }
  }

  const hasEditableField =
    "title" in body ||
    "content" in body ||
    "type" in body ||
    "sourceUrl" in body ||
    "categoryId" in body;

  if (!hasEditableField) {
    return {
      success: false,
      errors: { title: "At least one field must be provided." },
    };
  }

  const errors: NoteFieldErrors<UpdateNoteValues> = {};
  const data: UpdateNotePayload = {};

  if ("title" in body) {
    const title = parseOptionalString(body.title).trim();
    const titleError = validateTitle(title);
    if (titleError) {
      errors.title = titleError;
    } else {
      data.title = title;
    }
  }

  if ("content" in body) {
    const content = parseOptionalString(body.content);
    const contentError = validateContent(content);
    if (contentError) {
      errors.content = contentError;
    } else {
      data.content = content;
    }
  }

  if ("type" in body) {
    const type = parseOptionalString(body.type);
    const typeError = validateNoteType(type);
    if (typeError) {
      errors.type = typeError;
    } else {
      data.type = type as NoteType;
    }
  }

  if ("sourceUrl" in body) {
    const sourceUrl = parseOptionalNullableString(body.sourceUrl);
    if (sourceUrl === null) {
      data.sourceUrl = null;
    } else if (sourceUrl === undefined) {
      errors.sourceUrl = "Source URL must be a string or null.";
    } else {
      const trimmed = sourceUrl.trim();
      if (!trimmed) {
        data.sourceUrl = null;
      } else {
        const sourceUrlError = validateSourceUrl(trimmed);
        if (sourceUrlError) {
          errors.sourceUrl = sourceUrlError;
        } else {
          data.sourceUrl = trimmed;
        }
      }
    }
  }

  if ("categoryId" in body) {
    const categoryId = parseOptionalNullableString(body.categoryId);
    if (categoryId === null) {
      data.categoryId = null;
    } else if (categoryId === undefined) {
      errors.categoryId = "Category ID must be a string or null.";
    } else {
      const trimmed = categoryId.trim();
      if (!trimmed) {
        data.categoryId = null;
      } else {
        const categoryIdError = validateCategoryId(trimmed);
        if (categoryIdError) {
          errors.categoryId = categoryIdError;
        } else {
          data.categoryId = trimmed;
        }
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return { success: true, data };
}

export function parseNotesPagination(searchParams: URLSearchParams) {
  const DEFAULT_LIMIT = 20;
  const MAX_LIMIT = 100;

  const rawPage = searchParams.get("page");
  const rawLimit = searchParams.get("limit");

  let page = rawPage === null ? 1 : Number.parseInt(rawPage, 10);
  let limit = rawLimit === null ? DEFAULT_LIMIT : Number.parseInt(rawLimit, 10);

  if (!Number.isFinite(page) || page < 1) {
    page = 1;
  }

  if (!Number.isFinite(limit) || limit < 1) {
    limit = DEFAULT_LIMIT;
  } else if (limit > MAX_LIMIT) {
    limit = MAX_LIMIT;
  }

  return { page, limit, skip: (page - 1) * limit };
}

const MAX_SEARCH_LENGTH = 200;

export type NotesListQuery = {
  page: number;
  limit: number;
  skip: number;
  type: NoteType | null;
  categoryId: string | null;
  uncategorizedOnly: boolean;
  sort: NoteSortOption;
  search: string | null;
};

export function parseNotesListQuery(searchParams: URLSearchParams): NotesListQuery {
  const pagination = parseNotesPagination(searchParams);

  const rawType = searchParams.get("type");
  const type =
    rawType && NOTE_TYPES.has(rawType) ? (rawType as NoteType) : null;

  const rawCategoryId = searchParams.get("categoryId");
  let categoryId: string | null = null;
  let uncategorizedOnly = false;

  if (rawCategoryId === UNCategorized_CATEGORY_FILTER) {
    uncategorizedOnly = true;
  } else if (rawCategoryId && rawCategoryId.trim()) {
    categoryId = rawCategoryId.trim();
  }

  const rawSort = searchParams.get("sort");
  const sort = NOTE_SORT_OPTIONS.includes(rawSort as NoteSortOption)
    ? (rawSort as NoteSortOption)
    : "updated_desc";

  const rawSearch = searchParams.get("q");
  const trimmedSearch = rawSearch?.trim() ?? "";
  const search =
    trimmedSearch.length > 0
      ? trimmedSearch.slice(0, MAX_SEARCH_LENGTH)
      : null;

  return {
    ...pagination,
    type,
    categoryId,
    uncategorizedOnly,
    sort,
    search,
  };
}

export function notesListOrderBy(sort: NoteSortOption) {
  switch (sort) {
    case "created_desc":
      return { createdAt: "desc" as const };
    case "created_asc":
      return { createdAt: "asc" as const };
    case "title_asc":
      return { title: "asc" as const };
    case "updated_desc":
    default:
      return { updatedAt: "desc" as const };
  }
}
