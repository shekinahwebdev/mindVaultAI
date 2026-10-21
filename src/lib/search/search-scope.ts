import { DocumentStatus } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

import {
  buildDocumentsLibraryWhere,
  buildNotesLibraryWhere,
  libraryFiltersAreValid,
} from "@/lib/library/library-scope";

import type { SearchListQuery } from "./search-validation";

/** Documents eligible for search (indexed body + metadata). */
export function searchableDocumentWhere(userId: string): Prisma.DocumentWhereInput {
  return {
    userId,
    archivedAt: null,
    status: DocumentStatus.READY,
  };
}

export function buildSearchNotesWhere(
  userId: string,
  query: Pick<SearchListQuery, "q" | "tagId" | "collectionId">,
): Prisma.NoteWhereInput {
  return buildNotesLibraryWhere(userId, {
    search: query.q,
    tagId: query.tagId,
    collectionId: query.collectionId,
  });
}

export function buildSearchDocumentsMetadataWhere(
  userId: string,
  query: Pick<SearchListQuery, "q" | "tagId" | "collectionId">,
): Prisma.DocumentWhereInput {
  const base = searchableDocumentWhere(userId);
  const tagCollection: Prisma.DocumentWhereInput[] = [base];

  if (query.tagId) {
    tagCollection.push({
      documentTags: { some: { tagId: query.tagId } },
    });
  }
  if (query.collectionId) {
    tagCollection.push({
      collectionItems: { some: { collectionId: query.collectionId } },
    });
  }

  const metadataMatch: Prisma.DocumentWhereInput = {
    OR: [
      { title: { contains: query.q, mode: "insensitive" } },
      { originalFilename: { contains: query.q, mode: "insensitive" } },
    ],
  };

  return { AND: [...tagCollection, metadataMatch] };
}

export async function searchFiltersAreValid(
  userId: string,
  query: Pick<SearchListQuery, "tagId" | "collectionId">,
): Promise<boolean> {
  return libraryFiltersAreValid(userId, query);
}

export async function listFilteredNoteIds(
  userId: string,
  query: Pick<SearchListQuery, "tagId" | "collectionId">,
): Promise<string[]> {
  const rows = await prisma.note.findMany({
    where: buildNotesLibraryWhere(userId, {
      search: null,
      tagId: query.tagId,
      collectionId: query.collectionId,
    }),
    select: { id: true },
  });
  return rows.map((row) => row.id);
}

export async function listFilteredDocumentIds(
  userId: string,
  query: Pick<SearchListQuery, "tagId" | "collectionId">,
): Promise<string[]> {
  const whereParts: Prisma.DocumentWhereInput[] = [searchableDocumentWhere(userId)];
  if (query.tagId) {
    whereParts.push({ documentTags: { some: { tagId: query.tagId } } });
  }
  if (query.collectionId) {
    whereParts.push({
      collectionItems: { some: { collectionId: query.collectionId } },
    });
  }
  const where =
    whereParts.length === 1 ? whereParts[0] : { AND: whereParts };

  const rows = await prisma.document.findMany({
    where,
    select: { id: true },
  });
  return rows.map((row) => row.id);
}

/** @internal keyword document metadata filter without q (tag/collection only). */
export function buildSearchDocumentsScopeWhere(
  userId: string,
  query: Pick<SearchListQuery, "tagId" | "collectionId">,
): Prisma.DocumentWhereInput {
  return buildDocumentsLibraryWhere(userId, {
    search: null,
    tagId: query.tagId,
    collectionId: query.collectionId,
  });
}
