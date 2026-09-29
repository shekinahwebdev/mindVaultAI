import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

import { noteSelect } from "./serialize";

type CreateNoteData = {
  title: string;
  content: string;
  type: Prisma.NoteCreateInput["type"];
  sourceUrl: string | null;
  categoryId: string | null;
};

export async function createNoteWithTags(
  userId: string,
  data: CreateNoteData,
  tagIds: string[],
) {
  return prisma.$transaction(async (tx) => {
    const note = await tx.note.create({
      data: {
        title: data.title,
        content: data.content,
        type: data.type,
        sourceUrl: data.sourceUrl,
        categoryId: data.categoryId,
        userId,
        ...(tagIds.length > 0
          ? {
              noteTags: {
                create: tagIds.map((tagId) => ({
                  tag: { connect: { id: tagId } },
                })),
              },
            }
          : {}),
      },
      select: noteSelect,
    });

    return note;
  });
}

export async function replaceNoteTags(
  tx: Prisma.TransactionClient,
  noteId: string,
  tagIds: string[],
) {
  await tx.noteTag.deleteMany({ where: { noteId } });

  if (tagIds.length > 0) {
    await tx.noteTag.createMany({
      data: tagIds.map((tagId) => ({ noteId, tagId })),
    });
  }
}

export async function updateNoteWithOptionalTags(
  noteId: string,
  noteData: Prisma.NoteUpdateInput,
  tagIds: string[] | undefined,
) {
  return prisma.$transaction(async (tx) => {
    const note = await tx.note.update({
      where: { id: noteId },
      data: noteData,
      select: noteSelect,
    });

    if (tagIds !== undefined) {
      await replaceNoteTags(tx, noteId, tagIds);
      return tx.note.findFirstOrThrow({
        where: { id: noteId },
        select: noteSelect,
      });
    }

    return note;
  });
}
