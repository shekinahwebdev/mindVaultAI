import {
  LIBRARY_SORT_OPTIONS,
  LIBRARY_TYPE_FILTERS,
  type LibrarySortOption,
  type LibraryTypeFilter,
} from "./library-list-config";

const MAX_SEARCH_LENGTH = 200;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export type LibraryListQuery = {
  page: number;
  limit: number;
  skip: number;
  type: LibraryTypeFilter;
  sort: LibrarySortOption;
  search: string | null;
};

export function parseLibraryListQuery(searchParams: URLSearchParams): LibraryListQuery {
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

  const rawType = searchParams.get("type");
  const type = LIBRARY_TYPE_FILTERS.includes(rawType as LibraryTypeFilter)
    ? (rawType as LibraryTypeFilter)
    : "all";

  const rawSort = searchParams.get("sort");
  const sort = LIBRARY_SORT_OPTIONS.includes(rawSort as LibrarySortOption)
    ? (rawSort as LibrarySortOption)
    : "updated_desc";

  const rawSearch = searchParams.get("q");
  const trimmedSearch = rawSearch?.trim() ?? "";
  const search =
    trimmedSearch.length > 0 ? trimmedSearch.slice(0, MAX_SEARCH_LENGTH) : null;

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    type,
    sort,
    search,
  };
}
