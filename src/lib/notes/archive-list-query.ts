import type { Prisma } from "@/generated/prisma/client";

import type { ArchiveListQuery } from "@/lib/notes/archive-validation";
import { archivedNoteWhere } from "@/lib/notes/note-scope";

export function buildArchiveListWhere(
  userId: string,
  query: ArchiveListQuery,
): Prisma.NoteWhereInput {
  const conditions: Prisma.NoteWhereInput[] = [archivedNoteWhere(userId)];

  if (query.type) {
    conditions.push({ type: query.type });
  }

  if (query.categoryId) {
    conditions.push({ categoryId: query.categoryId });
  }

  if (query.search) {
    conditions.push({
      OR: [
        { title: { contains: query.search, mode: "insensitive" } },
        { content: { contains: query.search, mode: "insensitive" } },
      ],
    });
  }

  return conditions.length === 1 ? conditions[0] : { AND: conditions };
}
