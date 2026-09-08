export const NOTE_SORT_OPTIONS = [
  "updated_desc",
  "created_desc",
  "created_asc",
  "title_asc",
] as const;

export type NoteSortOption = (typeof NOTE_SORT_OPTIONS)[number];

export const UNCategorized_CATEGORY_FILTER = "uncategorized";

export const NOTES_PAGE_SIZE = 20;

export const NOTE_SORT_LABELS: Record<NoteSortOption, string> = {
  updated_desc: "Recently updated",
  created_desc: "Newest created",
  created_asc: "Oldest created",
  title_asc: "Title A–Z",
};
