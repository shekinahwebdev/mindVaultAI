import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { buildNotesListWhere } from "@/lib/notes/list-query";
import { activeNoteWhere } from "@/lib/notes/note-scope";
import { truncateNoteContent } from "@/lib/notes/note-display";
import { noteSelect, serializeNote } from "@/lib/notes/serialize";
import { serializeDocument } from "@/lib/documents/serialize";

import { activeLibraryDocumentWhere, LIBRARY_DOCUMENT_STATUSES } from "./document-list-scope";
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

function noteOrderBy(sort: LibrarySortOption) {
  switch (sort) {
    case "updated_asc":
      return { updatedAt: "asc" as const };
    case "created_desc":
      return { createdAt: "desc" as const };
    case "created_asc":
      return { createdAt: "asc" as const };
    case "title_asc":
      return { title: "asc" as const };
    default:
      return { updatedAt: "desc" as const };
  }
}

function documentOrderBy(sort: LibrarySortOption) {
  return noteOrderBy(sort);
}

function buildDocumentSearchWhere(search: string | null): Prisma.DocumentWhereInput {
  if (!search) {
    return {};
  }
  return {
    OR: [
      { title: { contains: search, mode: "insensitive" } },
      { originalFilename: { contains: search, mode: "insensitive" } },
    ],
  };
}

function buildNoteSearchWhere(userId: string, search: string | null): Prisma.NoteWhereInput {
  return buildNotesListWhere(userId, {
    page: 1,
    limit: 20,
    skip: 0,
    type: null,
    categoryId: null,
    tagId: null,
    uncategorizedOnly: false,
    sort: "updated_desc",
    search,
  });
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
      tags: [],
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
  const where = buildNoteSearchWhere(userId, query.search);
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
  const where = {
    ...activeLibraryDocumentWhere(userId),
    ...buildDocumentSearchWhere(query.search),
  };

  const [total, rows] = await Promise.all([
    prisma.document.count({ where }),
    prisma.document.findMany({
      where,
      orderBy: documentOrderBy(query.sort),
      skip: query.skip,
      take: query.limit,
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
      tags: [],
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

async function listMixedLibraryPage(
  userId: string,
  query: LibraryListQuery,
): Promise<LibraryListResult> {
  const searchPattern = query.search ? `%${query.search}%` : null;
  const statuses = LIBRARY_DOCUMENT_STATUSES;

  const noteSearchClause = searchPattern
    ? Prisma.sql`AND (n.title ILIKE ${searchPattern} OR n.content ILIKE ${searchPattern})`
    : Prisma.empty;

  const documentSearchClause = searchPattern
    ? Prisma.sql`AND (d.title ILIKE ${searchPattern} OR d.original_filename ILIKE ${searchPattern})`
    : Prisma.empty;

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
        UNION ALL
        SELECT d.id
        FROM documents d
        WHERE d.user_id = ${userId}
          AND d.archived_at IS NULL
          AND d.status::text = ANY(${statuses})
          ${documentSearchClause}
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
        UNION ALL
        SELECT 'document'::text AS kind, d.id, d.title, d.updated_at, d.created_at
        FROM documents d
        WHERE d.user_id = ${userId}
          AND d.archived_at IS NULL
          AND d.status::text = ANY(${statuses})
          ${documentSearchClause}
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
  activeNoteWhere,
  activeLibraryDocumentWhere,
  buildNoteSearchWhere,
  buildDocumentSearchWhere,
  libraryOrderSql,
};
