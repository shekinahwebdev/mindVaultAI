import type { ListTagsForUserOptions, TagSortOption, TagUsageFilter } from "./tag-repository";

const SORT_VALUES: TagSortOption[] = [
  "most_used",
  "least_used",
  "name_asc",
  "name_desc",
  "newest",
];

const FILTER_VALUES: TagUsageFilter[] = ["all", "used", "unused"];

const MAX_SEARCH_LENGTH = 64;

export type ParsedListTagsQuery = ListTagsForUserOptions;

export function parseListTagsQuery(searchParams: URLSearchParams):
  | { success: true; data: ParsedListTagsQuery }
  | { success: false; message: string } {
  const data: ParsedListTagsQuery = {};

  const sort = searchParams.get("sort");
  if (sort !== null && sort !== "") {
    if (!SORT_VALUES.includes(sort as TagSortOption)) {
      return { success: false, message: "Invalid sort value." };
    }
    data.sort = sort as TagSortOption;
  }

  const filter = searchParams.get("filter");
  if (filter !== null && filter !== "") {
    if (!FILTER_VALUES.includes(filter as TagUsageFilter)) {
      return { success: false, message: "Invalid filter value." };
    }
    data.filter = filter as TagUsageFilter;
  }

  const q = searchParams.get("q");
  if (q !== null && q !== "") {
    const trimmed = q.trim();
    if (trimmed.length > MAX_SEARCH_LENGTH) {
      return { success: false, message: "Search query is too long." };
    }
    data.search = trimmed;
  }

  return { success: true, data };
}
