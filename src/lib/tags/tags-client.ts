import { readAuthJson } from "@/lib/auth/client";

import { TAG_SERVER_ERROR_MESSAGE } from "./tag-errors";
import type { SerializedTag } from "./serialize";

export type { SerializedTag };

export type TagSortOption =
  | "most_used"
  | "least_used"
  | "name_asc"
  | "name_desc"
  | "newest";

export type TagUsageFilter = "all" | "used" | "unused";

export type TagStats = {
  totalTags: number;
  unusedTags: number;
  mostUsedTag: {
    id: string;
    name: string;
    noteCount: number;
  } | null;
};

export type ListTagsParams = {
  q?: string;
  sort?: TagSortOption;
  filter?: TagUsageFilter;
  signal?: AbortSignal;
};

export type ListTagsResponse =
  | {
      ok: true;
      tags: SerializedTag[];
      stats: TagStats;
      insights: SerializedTag[];
    }
  | { ok: false; message?: string };

export type TagMutationResponse =
  | { ok: true; tag: SerializedTag }
  | {
      ok: false;
      errors?: { name?: string };
      message?: string;
    };

export type DeleteTagResponse =
  | { ok: true }
  | { ok: false; message?: string };

export const TAG_LOAD_ERROR = "We couldn't load your tags.";
export const TAG_CLIENT_ERROR = TAG_SERVER_ERROR_MESSAGE;
export const TAG_CREATED_MESSAGE = "Tag created.";
export const TAG_RENAMED_MESSAGE = "Tag renamed.";
export const TAG_DELETED_MESSAGE = "Tag deleted.";

export function buildTagsListUrl(params?: ListTagsParams): string {
  const searchParams = new URLSearchParams();

  const q = params?.q?.trim();
  if (q) {
    searchParams.set("q", q);
  }

  if (params?.sort) {
    searchParams.set("sort", params.sort);
  }

  if (params?.filter && params.filter !== "all") {
    searchParams.set("filter", params.filter);
  }

  const query = searchParams.toString();
  return query ? `/api/tags?${query}` : "/api/tags";
}

export type GetTagResponse =
  | { ok: true; tag: SerializedTag }
  | { ok: false; message?: string };

export async function fetchTag(id: string, signal?: AbortSignal) {
  const response = await fetch(`/api/tags/${id}`, { signal });
  const data = await readAuthJson<GetTagResponse>(response);
  return { response, data };
}

export async function fetchTags(params?: ListTagsParams) {
  const response = await fetch(buildTagsListUrl(params), {
    signal: params?.signal,
  });

  const data = await readAuthJson<ListTagsResponse>(response);
  return { response, data };
}

export async function createTag(name: string) {
  const response = await fetch("/api/tags", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

  const data = await readAuthJson<TagMutationResponse>(response);
  return { response, data };
}

export async function renameTag(id: string, name: string) {
  const response = await fetch(`/api/tags/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

  const data = await readAuthJson<TagMutationResponse>(response);
  return { response, data };
}

export async function deleteTag(id: string) {
  const response = await fetch(`/api/tags/${id}`, {
    method: "DELETE",
  });

  const data = await readAuthJson<DeleteTagResponse>(response);
  return { response, data };
}

export function getMutationFieldError(
  data: TagMutationResponse | null,
  fallback = TAG_CLIENT_ERROR,
): { fieldError?: string; formError?: string } {
  if (!data || data.ok) {
    return {};
  }

  if (data.errors?.name) {
    return { fieldError: data.errors.name };
  }

  return { formError: data.message ?? fallback };
}
