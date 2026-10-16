import type { SearchContentType, SearchMode } from "./search-types";

const MAX_SEARCH_LENGTH = 200;
const MIN_SEMANTIC_LENGTH = 2;
const MAX_SEMANTIC_LENGTH = 500;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const DEFAULT_PAGE = 1;

const SEARCH_MODES: SearchMode[] = ["keyword", "semantic"];
const SEARCH_TYPES: SearchContentType[] = ["all", "note", "document"];

export type SearchListQuery = {
  q: string;
  mode: SearchMode;
  type: SearchContentType;
  tagId: string | null;
  collectionId: string | null;
  page: number;
  limit: number;
  skip: number;
};

export function parseSearchListQuery(searchParams: URLSearchParams): SearchListQuery {
  const rawPage = searchParams.get("page");
  const rawLimit = searchParams.get("limit");

  let page = rawPage === null ? DEFAULT_PAGE : Number.parseInt(rawPage, 10);
  let limit = rawLimit === null ? DEFAULT_LIMIT : Number.parseInt(rawLimit, 10);

  if (!Number.isFinite(page) || page < 1) {
    page = DEFAULT_PAGE;
  }
  if (!Number.isFinite(limit) || limit < 1) {
    limit = DEFAULT_LIMIT;
  } else if (limit > MAX_LIMIT) {
    limit = MAX_LIMIT;
  }

  const rawMode = searchParams.get("mode");
  const mode = SEARCH_MODES.includes(rawMode as SearchMode)
    ? (rawMode as SearchMode)
    : "keyword";

  const rawType = searchParams.get("type");
  const type = SEARCH_TYPES.includes(rawType as SearchContentType)
    ? (rawType as SearchContentType)
    : "all";

  const q = (searchParams.get("q") ?? "").trim();

  const rawTagId = searchParams.get("tagId");
  const tagId = rawTagId && rawTagId.trim() ? rawTagId.trim() : null;

  const rawCollectionId = searchParams.get("collectionId");
  const collectionId =
    rawCollectionId && rawCollectionId.trim() ? rawCollectionId.trim() : null;

  return {
    q,
    mode,
    type,
    tagId,
    collectionId,
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

export function validateSearchQuery(query: SearchListQuery): { ok: true } | { ok: false; reason: "empty" | "too_short" | "too_long" } {
  if (!query.q) {
    return { ok: false, reason: "empty" };
  }

  if (query.mode === "semantic") {
    if (query.q.length < MIN_SEMANTIC_LENGTH) {
      return { ok: false, reason: "too_short" };
    }
    if (query.q.length > MAX_SEMANTIC_LENGTH) {
      return { ok: false, reason: "too_long" };
    }
    return { ok: true };
  }

  if (query.q.length > MAX_SEARCH_LENGTH) {
    return { ok: false, reason: "too_long" };
  }

  return { ok: true };
}

export const searchValidationConstants = {
  MAX_SEARCH_LENGTH,
  MIN_SEMANTIC_LENGTH,
  MAX_SEMANTIC_LENGTH,
  DEFAULT_LIMIT,
  MAX_LIMIT,
};
