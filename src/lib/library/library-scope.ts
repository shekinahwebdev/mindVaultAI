import type { Prisma } from "@/generated/prisma/client";

import { buildNotesListWhere } from "@/lib/notes/list-query";
import { activeNoteWhere } from "@/lib/notes/note-scope";

import { activeLibraryDocumentWhere } from "./document-list-scope";
import type { LibraryListQuery } from "./library-validation";

export function buildNotesLibraryWhere(
  userId: string,
  query: Pick<LibraryListQuery, "search" | "tagId" | "collectionId">,
): Prisma.NoteWhereInput {
  const base = buildNotesListWhere(userId, {
    page: 1,
    limit: 20,
    skip: 0,
    type: null,
    categoryId: null,
    tagId: query.tagId,
    uncategorizedOnly: false,
    sort: "updated_desc",
    search: query.search,
  });

  if (!query.collectionId) {
    return base;
  }

  return {
    AND: [
      base,
      {
        collectionItems: {
          some: { collectionId: query.collectionId },
        },
      },
    ],
  };
}

export function buildDocumentsLibraryWhere(
  userId: string,
  query: Pick<LibraryListQuery, "search" | "tagId" | "collectionId">,
): Prisma.DocumentWhereInput {
  const conditions: Prisma.DocumentWhereInput[] = [activeLibraryDocumentWhere(userId)];

  if (query.search) {
    conditions.push({
      OR: [
        { title: { contains: query.search, mode: "insensitive" } },
        { originalFilename: { contains: query.search, mode: "insensitive" } },
      ],
    });
  }

  if (query.tagId) {
    conditions.push({
      documentTags: {
        some: { tagId: query.tagId },
      },
    });
  }

  if (query.collectionId) {
    conditions.push({
      collectionItems: {
        some: { collectionId: query.collectionId },
      },
    });
  }

  return conditions.length === 1 ? conditions[0] : { AND: conditions };
}

export async function libraryFiltersAreValid(
  userId: string,
  query: Pick<LibraryListQuery, "tagId" | "collectionId">,
): Promise<boolean> {
  if (query.collectionId) {
    const { getCollectionForUser } = await import("@/lib/collections/collection-repository");
    const collection = await getCollectionForUser(userId, query.collectionId);
    if (!collection) {
      return false;
    }
  }

  if (query.tagId) {
    const { findTagForUser } = await import("@/lib/tags/tag-repository");
    const tag = await findTagForUser(userId, query.tagId);
    if (!tag) {
      return false;
    }
  }

  return true;
}

export const libraryScopeInternals = { activeNoteWhere };
