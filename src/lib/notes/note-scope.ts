import type { Prisma } from "@/generated/prisma/client";

/** Active notes in the normal vault (not archived). */
export function activeNoteWhere(userId: string): Prisma.NoteWhereInput {
  return { userId, archivedAt: null };
}

/** Archived notes only. */
export function archivedNoteWhere(userId: string): Prisma.NoteWhereInput {
  return { userId, archivedAt: { not: null } };
}

export const ACTIVE_NOTE_TAG_COUNT_FILTER = {
  note: { archivedAt: null },
} as const;

export const ACTIVE_CATEGORY_NOTE_COUNT_FILTER = {
  archivedAt: null,
} as const;
