import { NoteType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import {
  archiveListOrderBy,
  type ArchiveListQuery,
} from "@/lib/notes/archive-validation";
import { buildArchiveListWhere } from "@/lib/notes/archive-list-query";
import {
  activeNoteWhere,
  archivedNoteWhere,
} from "@/lib/notes/note-scope";
import { noteSelect, serializeNote } from "@/lib/notes/serialize";
import { truncateNoteContent } from "@/lib/notes/note-display";
import type {
  ArchiveOverviewStats,
  SerializedArchivedNoteItem,
} from "@/lib/notes/archive-types";

export type { ArchiveOverviewStats, SerializedArchivedNoteItem };

function toArchivedItem(
  note: Parameters<typeof serializeNote>[0] & { archivedAt: Date | null },
): SerializedArchivedNoteItem {
  const serialized = serializeNote(note);
  if (!note.archivedAt) {
    throw new Error("Expected archived note");
  }

  return {
    id: serialized.id,
    title: serialized.title,
    description: truncateNoteContent(serialized.content, 120),
    type: serialized.type,
    category: serialized.category?.name ?? "Uncategorized",
    categoryId: serialized.categoryId,
    tags: serialized.tags.map((tag) => tag.name),
    archivedAt: note.archivedAt.toISOString(),
    updatedAt: serialized.updatedAt,
    sourceUrl: serialized.sourceUrl,
  };
}

export async function listArchivedNotesForUser(
  userId: string,
  query: ArchiveListQuery,
): Promise<SerializedArchivedNoteItem[]> {
  const notes = await prisma.note.findMany({
    where: buildArchiveListWhere(userId, query),
    orderBy: archiveListOrderBy(query.sort),
    select: { ...noteSelect, archivedAt: true },
  });

  return notes.map(toArchivedItem);
}

export async function getArchiveOverviewStats(
  userId: string,
): Promise<ArchiveOverviewStats> {
  const grouped = await prisma.note.groupBy({
    by: ["type"],
    where: archivedNoteWhere(userId),
    _count: { _all: true },
  });

  const countFor = (type: NoteType) =>
    grouped.find((row) => row.type === type)?._count._all ?? 0;

  const noteCount = countFor(NoteType.NOTE) + countFor(NoteType.QUOTE);
  const codeCount = countFor(NoteType.CODE);
  const linkCount = countFor(NoteType.LINK);
  const articleCount = countFor(NoteType.ARTICLE);

  return {
    total: grouped.reduce((sum, row) => sum + row._count._all, 0),
    noteCount,
    codeCount,
    linkCount,
    articleCount,
  };
}

export async function archiveNoteForUser(userId: string, noteId: string) {
  const existing = await prisma.note.findFirst({
    where: { id: noteId, userId },
    select: { id: true, archivedAt: true },
  });

  if (!existing) {
    return null;
  }

  if (existing.archivedAt) {
    return prisma.note.findFirst({
      where: { id: noteId, userId },
      select: { ...noteSelect, archivedAt: true },
    });
  }

  return prisma.note.update({
    where: { id: noteId },
    data: { archivedAt: new Date() },
    select: { ...noteSelect, archivedAt: true },
  });
}

export async function restoreNoteForUser(userId: string, noteId: string) {
  const existing = await prisma.note.findFirst({
    where: { id: noteId, userId, archivedAt: { not: null } },
    select: { id: true },
  });

  if (!existing) {
    return null;
  }

  return prisma.note.update({
    where: { id: noteId },
    data: { archivedAt: null },
    select: { ...noteSelect, archivedAt: true },
  });
}

export async function emptyArchivedNotesForUser(userId: string) {
  const result = await prisma.note.deleteMany({
    where: archivedNoteWhere(userId),
  });
  return result.count;
}

export async function countActiveNotesForUser(userId: string) {
  return prisma.note.count({ where: activeNoteWhere(userId) });
}
