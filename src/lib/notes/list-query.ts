import type { Prisma } from "@/generated/prisma/client";

import type { NotesListQuery } from "@/lib/note-validation";

export function buildNotesListWhere(
  userId: string,
  query: NotesListQuery,
): Prisma.NoteWhereInput {
  const conditions: Prisma.NoteWhereInput[] = [{ userId }];

  if (query.type) {
    conditions.push({ type: query.type });
  }

  if (query.uncategorizedOnly) {
    conditions.push({ categoryId: null });
  } else if (query.categoryId) {
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
