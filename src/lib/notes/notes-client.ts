import { readAuthJson } from "@/lib/auth/client";
import {
  NOTE_SORT_OPTIONS,
  NOTES_PAGE_SIZE,
  type NoteSortOption,
  UNCategorized_CATEGORY_FILTER,
} from "@/lib/notes/notes-list-config";

import type { SerializedNote } from "./serialize";

export type NotesPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ListNotesResponse =
  | { ok: true; notes: SerializedNote[]; pagination: NotesPagination }
  | { ok: false; message?: string };

export type NotesListParams = {
  page?: number;
  limit?: number;
  type?: string;
  categoryId?: string;
  sort?: NoteSortOption;
  q?: string;
};

export { NOTE_SORT_OPTIONS, NOTES_PAGE_SIZE, UNCategorized_CATEGORY_FILTER };
export type { NoteSortOption };

export const NOTES_LOAD_ERROR =
  "Could not load your notes. Please try again.";

export function buildNotesQueryString(params: NotesListParams) {
  const search = new URLSearchParams();

  if (params.page && params.page > 1) {
    search.set("page", String(params.page));
  }

  if (params.limit) {
    search.set("limit", String(params.limit));
  }

  if (params.type) {
    search.set("type", params.type);
  }

  if (params.categoryId) {
    search.set("categoryId", params.categoryId);
  }

  if (params.sort && params.sort !== "updated_desc") {
    search.set("sort", params.sort);
  }

  if (params.q?.trim()) {
    search.set("q", params.q.trim());
  }

  const query = search.toString();
  return query ? `?${query}` : "";
}

export async function fetchNotes(params: NotesListParams = {}) {
  const response = await fetch(
    `/api/notes${buildNotesQueryString({
      limit: NOTES_PAGE_SIZE,
      ...params,
    })}`,
  );

  const data = await readAuthJson<ListNotesResponse>(response);
  return { response, data };
}
