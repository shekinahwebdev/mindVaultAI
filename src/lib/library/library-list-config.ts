export const LIBRARY_PAGE_SIZE = 20;

export const LIBRARY_TYPE_FILTERS = ["all", "note", "document"] as const;
export type LibraryTypeFilter = (typeof LIBRARY_TYPE_FILTERS)[number];

export const LIBRARY_SORT_OPTIONS = [
  "updated_desc",
  "updated_asc",
  "created_desc",
  "created_asc",
  "title_asc",
] as const;
export type LibrarySortOption = (typeof LIBRARY_SORT_OPTIONS)[number];

export const LIBRARY_SORT_LABELS: Record<LibrarySortOption, string> = {
  updated_desc: "Recently updated",
  updated_asc: "Oldest updated",
  created_desc: "Recently created",
  created_asc: "Oldest created",
  title_asc: "Title A–Z",
};
