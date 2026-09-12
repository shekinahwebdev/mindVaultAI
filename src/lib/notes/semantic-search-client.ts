import { readAuthJson } from "@/lib/auth/client";

import type { SerializedNote } from "./serialize";

export type SemanticSearchMatch = {
  note: SerializedNote;
  similarity: number;
};

export type SemanticSearchApiResponse =
  | { ok: true; matches: SemanticSearchMatch[] }
  | { ok: false; message?: string };

export const SEMANTIC_SEARCH_LOAD_ERROR =
  "Semantic search isn't available right now. You can still search your vault normally.";

export async function semanticSearchRequest(query: string, signal?: AbortSignal) {
  const response = await fetch(
    `/api/search/semantic?q=${encodeURIComponent(query)}`,
    { signal },
  );

  const data = await readAuthJson<SemanticSearchApiResponse>(response);
  return { response, data };
}
