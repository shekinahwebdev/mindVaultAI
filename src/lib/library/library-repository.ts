import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import {
  documentTagSelect,
  serializeDocumentTags,
} from "@/lib/documents/document-tags-repository";
import { serializeDocument } from "@/lib/documents/serialize";
import { truncateNoteContent } from "@/lib/notes/note-display";
import { noteSelect, serializeNote } from "@/lib/notes/serialize";

import { activeLibraryDocumentWhere, LIBRARY_DOCUMENT_STATUSES } from "./document-list-scope";
import {
  buildDocumentsLibraryWhere,
  buildNotesLibraryWhere,
  libraryFiltersAreValid,
} from "./library-scope";
import type { LibrarySortOption } from "./library-list-config";
import type { LibraryListResult, SerializedLibraryItem } from "./library-types";
import type { LibraryListQuery } from "./library-validation";

type LibraryUnionRow = {
  kind: string;
  id: string;
};

function libraryOrderSql(sort: LibrarySortOption): Prisma.Sql {
  switch (sort) {
    case "updated_asc":
      return Prisma.sql`updated_at ASC, id ASC`;
    case "created_desc":
      return Prisma.sql`created_at DESC, id DESC`;
    case "created_asc":
      return Prisma.sql`created_at ASC, id ASC`;
    case "title_asc":
      return Prisma.sql`LOWER(title) ASC, id ASC`;
    default:
      return Prisma.sql`updated_at DESC, id DESC`;
  }
}

function noteOrderBy(sort: LibrarySortOption): Prisma.NoteOrderByWithRelationInput[] {
  switch (sort) {
    case "updated_asc":
      return [{ updatedAt: "asc" }, { id: "asc" }];
    case "created_desc":
      return [{ createdAt: "desc" }, { id: "desc" }];
    case "created_asc":
      return [{ createdAt: "asc" }, { id: "asc" }];
    case "title_asc":
      return [{ title: "asc" }, { id: "asc" }];
    default:
      return [{ updatedAt: "desc" }, { id: "desc" }];
  }
}

function documentOrderBy(sort: LibrarySortOption): Prisma.DocumentOrderByWithRelationInput[] {
  return noteOrderBy(sort) as Prisma.DocumentOrderByWithRelationInput[];
}

function emptyLibraryResult(query: LibraryListQuery): LibraryListResult {
  return {
    items: [],
    pagination: {
      page: query.page,
      limit: query.limit,
      total: 0,
      totalPages: 0,
    },
  };
}

async function findJobForDocument(documentId: string, processingVersion: number) {
  return prisma.documentProcessingJob.findUnique({
    where: {
      documentId_processingVersion: {
        documentId,
        processingVersion,
      },
    },
  });
}

async function hydrateLibraryRows(
  userId: string,
  rows: LibraryUnionRow[],
): Promise<SerializedLibraryItem[]> {
  if (rows.length === 0) {
    return [];
  }

  const noteIds = rows.filter((row) => row.kind === "note").map((row) => row.id);
  const documentIds = rows.filter((row) => row.kind === "document").map((row) => row.id);

  const [notes, documents] = await Promise.all([
    noteIds.length
      ? prisma.note.findMany({
          where: { id: { in: noteIds }, userId, archivedAt: null },
          select: noteSelect,
        })
      : [],
    documentIds.length
      ? prisma.document.findMany({
          where: {
            id: { in: documentIds },
            ...activeLibraryDocumentWhere(userId),
          },
          include: documentTagSelect,
        })
      : [],
  ]);

  const noteMap = new Map(notes.map((note) => [note.id, note]));
  const documentMap = new Map(documents.map((doc) => [doc.id, doc]));

  const items: SerializedLibraryItem[] = [];

  for (const row of rows) {
    if (row.kind === "note") {
      const note = noteMap.get(row.id);
      if (!note) continue;
      const serialized = serializeNote(note);
      items.push({
        kind: "note",
        id: serialized.id,
        title: serialized.title,
        preview: truncateNoteContent(serialized.content, 160) || null,
        createdAt: serialized.createdAt,
        updatedAt: serialized.updatedAt,
        tags: serialized.tags,
        noteType: serialized.type,
        processingDisplayStatus: null,
        processingLabel: null,
      });
      continue;
    }

    const document = documentMap.get(row.id);
    if (!document) continue;
    const job = await findJobForDocument(document.id, document.processingVersion);
    const serialized = serializeDocument(document, job);
    items.push({
      kind: "document",
      id: serialized.id,
      title: serialized.title,
      preview: serialized.originalFilename,
      createdAt: serialized.createdAt,
      updatedAt: serialized.updatedAt,
      tags: serializeDocumentTags(document.documentTags),
      noteType: null,
      processingDisplayStatus: serialized.processingDisplayStatus,
      processingLabel: serialized.processingLabel,
    });
  }

  return items;
}

async function listNotesPage(
  userId: string,
  query: LibraryListQuery,
): Promise<LibraryListResult> {
  const where = buildNotesLibraryWhere(userId, query);
  const [total, rows] = await Promise.all([
    prisma.note.count({ where }),
    prisma.note.findMany({
      where,
      orderBy: noteOrderBy(query.sort),
      skip: query.skip,
      take: query.limit,
      select: noteSelect,
    }),
  ]);

  const items: SerializedLibraryItem[] = rows.map((note) => {
    const serialized = serializeNote(note);
    return {
      kind: "note",
      id: serialized.id,
      title: serialized.title,
      preview: truncateNoteContent(serialized.content, 160) || null,
      createdAt: serialized.createdAt,
      updatedAt: serialized.updatedAt,
      tags: serialized.tags,
      noteType: serialized.type,
      processingDisplayStatus: null,
      processingLabel: null,
    };
  });

  return {
    items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
    },
  };
}

async function listDocumentsPage(
  userId: string,
  query: LibraryListQuery,
): Promise<LibraryListResult> {
  const where = buildDocumentsLibraryWhere(userId, query);

  const [total, rows] = await Promise.all([
    prisma.document.count({ where }),
    prisma.document.findMany({
      where,
      orderBy: documentOrderBy(query.sort),
      skip: query.skip,
      take: query.limit,
      include: documentTagSelect,
    }),
  ]);

  const items: SerializedLibraryItem[] = [];
  for (const row of rows) {
    const job = await findJobForDocument(row.id, row.processingVersion);
    const serialized = serializeDocument(row, job);
    items.push({
      kind: "document",
      id: serialized.id,
      title: serialized.title,
      preview: serialized.originalFilename,
      createdAt: serialized.createdAt,
      updatedAt: serialized.updatedAt,
      tags: serializeDocumentTags(row.documentTags),
      noteType: null,
      processingDisplayStatus: serialized.processingDisplayStatus,
      processingLabel: serialized.processingLabel,
    });
  }

  return {
    items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
    },
  };
}

function libraryFilterSql(query: LibraryListQuery) {
  const searchPattern = query.search ? `%${query.search}%` : null;
  const noteSearchClause = searchPattern
    ? Prisma.sql`AND (n.title ILIKE ${searchPattern} OR n.content ILIKE ${searchPattern})`
    : Prisma.empty;
  const documentSearchClause = searchPattern
    ? Prisma.sql`AND (d.title ILIKE ${searchPattern} OR d.original_filename ILIKE ${searchPattern})`
    : Prisma.empty;

  const noteTagClause = query.tagId
    ? Prisma.sql`AND EXISTS (SELECT 1 FROM note_tags nt WHERE nt.note_id = n.id AND nt.tag_id = ${query.tagId})`
    : Prisma.empty;
  const documentTagClause = query.tagId
    ? Prisma.sql`AND EXISTS (SELECT 1 FROM document_tags dt WHERE dt.document_id = d.id AND dt.tag_id = ${query.tagId})`
    : Prisma.empty;

  const noteCollectionClause = query.collectionId
    ? Prisma.sql`AND EXISTS (SELECT 1 FROM collection_items ci WHERE ci.collection_id = ${query.collectionId} AND ci.note_id = n.id)`
    : Prisma.empty;
  const documentCollectionClause = query.collectionId
    ? Prisma.sql`AND EXISTS (SELECT 1 FROM collection_items ci WHERE ci.collection_id = ${query.collectionId} AND ci.document_id = d.id)`
    : Prisma.empty;

  return {
    noteSearchClause,
    documentSearchClause,
    noteTagClause,
    documentTagClause,
    noteCollectionClause,
    documentCollectionClause,
  };
}

async function listMixedLibraryPage(
  userId: string,
  query: LibraryListQuery,
): Promise<LibraryListResult> {
  const statuses = LIBRARY_DOCUMENT_STATUSES;
  const {
    noteSearchClause,
    documentSearchClause,
    noteTagClause,
    documentTagClause,
    noteCollectionClause,
    documentCollectionClause,
  } = libraryFilterSql(query);

  const orderSql = libraryOrderSql(query.sort);

  const [countRows, unionRows] = await Promise.all([
    prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count
      FROM (
        SELECT n.id
        FROM notes n
        WHERE n.user_id = ${userId}
          AND n.archived_at IS NULL
          ${noteSearchClause}
          ${noteTagClause}
          ${noteCollectionClause}
        UNION ALL
        SELECT d.id
        FROM documents d
        WHERE d.user_id = ${userId}
          AND d.archived_at IS NULL
          AND d.status::text = ANY(${statuses})
          ${documentSearchClause}
          ${documentTagClause}
          ${documentCollectionClause}
      ) AS library_rows
    `,
    prisma.$queryRaw<LibraryUnionRow[]>`
      SELECT kind, id
      FROM (
        SELECT 'note'::text AS kind, n.id, n.title, n.updated_at, n.created_at
        FROM notes n
        WHERE n.user_id = ${userId}
          AND n.archived_at IS NULL
          ${noteSearchClause}
          ${noteTagClause}
          ${noteCollectionClause}
        UNION ALL
        SELECT 'document'::text AS kind, d.id, d.title, d.updated_at, d.created_at
        FROM documents d
        WHERE d.user_id = ${userId}
          AND d.archived_at IS NULL
          AND d.status::text = ANY(${statuses})
          ${documentSearchClause}
          ${documentTagClause}
          ${documentCollectionClause}
      ) AS library_union
      ORDER BY ${orderSql}
      LIMIT ${query.limit}
      OFFSET ${query.skip}
    `,
  ]);

  const total = Number(countRows[0]?.count ?? 0);
  const items = await hydrateLibraryRows(userId, unionRows);

  return {
    items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
    },
  };
}

export async function listLibraryForUser(
  userId: string,
  query: LibraryListQuery,
): Promise<LibraryListResult> {
  const filtersValid = await libraryFiltersAreValid(userId, query);
  if (!filtersValid) {
    return emptyLibraryResult(query);
  }

  if (query.type === "note") {
    return listNotesPage(userId, query);
  }
  if (query.type === "document") {
    return listDocumentsPage(userId, query);
  }
  return listMixedLibraryPage(userId, query);
}

/** @internal test helpers */
export const libraryRepositoryInternals = {
  activeLibraryDocumentWhere,
  buildNotesLibraryWhere,
  buildDocumentsLibraryWhere,
  libraryOrderSql,
};
