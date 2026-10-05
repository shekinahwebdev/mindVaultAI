import type { Prisma } from "@/generated/prisma/client";
import { NoteType } from "@/generated/prisma/client";

export const ARCHIVE_SORT_OPTIONS = [
  "recently_archived",
  "oldest_archived",
  "recently_updated",
  "title_asc",
  "title_desc",
] as const;

export type ArchiveSortOption = (typeof ARCHIVE_SORT_OPTIONS)[number];

export type ArchiveListQuery = {
  search?: string;
  type?: NoteType;
  categoryId?: string;
  sort: ArchiveSortOption;
};

const NOTE_TYPES = new Set<string>(Object.values(NoteType));

function parseArchiveSort(value: string | null): ArchiveSortOption {
  if (value && (ARCHIVE_SORT_OPTIONS as readonly string[]).includes(value)) {
    return value as ArchiveSortOption;
  }
  return "recently_archived";
}

export function parseArchiveListQuery(
  searchParams: URLSearchParams,
): ArchiveListQuery {
  const q = searchParams.get("q")?.trim();
  const typeRaw = searchParams.get("type")?.trim() ?? "";
  const categoryId = searchParams.get("categoryId")?.trim() || undefined;
  const sort = parseArchiveSort(searchParams.get("sort"));

  const query: ArchiveListQuery = { sort };

  if (q) {
    query.search = q;
  }

  if (typeRaw && NOTE_TYPES.has(typeRaw)) {
    query.type = typeRaw as NoteType;
  }

  if (categoryId) {
    query.categoryId = categoryId;
  }

  return query;
}

export function archiveListOrderBy(
  sort: ArchiveSortOption,
): Prisma.NoteOrderByWithRelationInput[] {
  switch (sort) {
    case "oldest_archived":
      return [{ archivedAt: "asc" }];
    case "recently_updated":
      return [{ updatedAt: "desc" }];
    case "title_asc":
      return [{ title: "asc" }];
    case "title_desc":
      return [{ title: "desc" }];
    case "recently_archived":
    default:
      return [{ archivedAt: "desc" }];
  }
}
