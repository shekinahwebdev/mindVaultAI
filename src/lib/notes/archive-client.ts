import { readAuthJson } from "@/lib/auth/client";

import type {
  ArchiveOverviewStats,
  SerializedArchivedNoteItem,
} from "@/lib/notes/archive-types";
import type { ArchiveSortOption } from "@/lib/notes/archive-validation";
import type { SerializedNote } from "@/lib/notes/serialize";

export type { SerializedArchivedNoteItem, ArchiveOverviewStats };

export type FetchArchiveParams = {
  q?: string;
  type?: string;
  categoryId?: string;
  sort?: ArchiveSortOption;
};

export type FetchArchiveResponse =
  | {
      ok: true;
      notes: SerializedArchivedNoteItem[];
      stats: ArchiveOverviewStats;
    }
  | { ok: false; message?: string };

export async function fetchArchive(params: FetchArchiveParams = {}) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.type) search.set("type", params.type);
  if (params.categoryId) search.set("categoryId", params.categoryId);
  if (params.sort) search.set("sort", params.sort);

  const query = search.toString();
  const response = await fetch(`/api/archive${query ? `?${query}` : ""}`);
  const data = await readAuthJson<FetchArchiveResponse>(response);
  return { response, data };
}

export type ArchiveNoteResponse =
  | { ok: true; note: SerializedNote }
  | { ok: false; message?: string };

export async function archiveNoteRequest(noteId: string) {
  const response = await fetch(`/api/notes/${noteId}/archive`, {
    method: "POST",
  });
  const data = await readAuthJson<ArchiveNoteResponse>(response);
  return { response, data };
}

export async function restoreNoteRequest(noteId: string) {
  const response = await fetch(`/api/notes/${noteId}/restore`, {
    method: "POST",
  });
  const data = await readAuthJson<ArchiveNoteResponse>(response);
  return { response, data };
}

export type EmptyArchiveResponse =
  | { ok: true; deletedCount: number }
  | { ok: false; message?: string };

export async function emptyArchiveRequest() {
  const response = await fetch("/api/archive", { method: "DELETE" });
  const data = await readAuthJson<EmptyArchiveResponse>(response);
  return { response, data };
}
