import { readAuthJson } from "@/lib/auth/client";

import type { LibraryListResult } from "./library-types";
import type { LibraryListQuery } from "./library-validation";

export function buildLibraryQueryString(query: Partial<LibraryListQuery>): string {
  const params = new URLSearchParams();
  if (query.page && query.page > 1) {
    params.set("page", String(query.page));
  }
  if (query.limit) {
    params.set("limit", String(query.limit));
  }
  if (query.type && query.type !== "all") {
    params.set("type", query.type);
  }
  if (query.sort && query.sort !== "updated_desc") {
    params.set("sort", query.sort);
  }
  if (query.search) {
    params.set("q", query.search);
  }
  if (query.tagId) {
    params.set("tagId", query.tagId);
  }
  if (query.collectionId) {
    params.set("collectionId", query.collectionId);
  }
  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

export const LIBRARY_LOAD_ERROR = "Could not load your library.";

type LibraryApiResponse =
  | { ok: true; library: LibraryListResult }
  | { ok: false; message?: string };

export async function fetchLibrary(query: Partial<LibraryListQuery>) {
  const qs = buildLibraryQueryString(query);
  const response = await fetch(`/api/library${qs}`);
  const data = await readAuthJson<LibraryApiResponse>(response);
  return { response, data };
}
