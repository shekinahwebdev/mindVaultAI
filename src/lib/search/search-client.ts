import { readAuthJson } from "@/lib/auth/client";

import type { SearchContentType, SearchListResult, SearchMode } from "./search-types";

export type SearchRequestParams = {
  q: string;
  mode: SearchMode;
  type?: SearchContentType;
  tagId?: string | null;
  collectionId?: string | null;
  page?: number;
  limit?: number;
};

export type SearchApiResponse =
  | { ok: true; search: SearchListResult }
  | { ok: false; message?: string };

export const SEARCH_LOAD_ERROR = "Could not search your vault. Please try again.";

export function buildSearchQueryString(params: SearchRequestParams): string {
  const search = new URLSearchParams();
  search.set("q", params.q);
  search.set("mode", params.mode);
  if (params.type && params.type !== "all") {
    search.set("type", params.type);
  }
  if (params.tagId) {
    search.set("tagId", params.tagId);
  }
  if (params.collectionId) {
    search.set("collectionId", params.collectionId);
  }
  if (params.page && params.page > 1) {
    search.set("page", String(params.page));
  }
  if (params.limit) {
    search.set("limit", String(params.limit));
  }
  const serialized = search.toString();
  return serialized ? `?${serialized}` : "";
}

export async function fetchSearch(params: SearchRequestParams, signal?: AbortSignal) {
  const qs = buildSearchQueryString(params);
  const response = await fetch(`/api/search${qs}`, { signal });
  const data = await readAuthJson<SearchApiResponse>(response);
  return { response, data };
}
