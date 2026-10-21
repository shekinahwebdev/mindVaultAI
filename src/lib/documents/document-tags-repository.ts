import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { tagIdsBelongToUser } from "@/lib/notes/tag-ownership";
import { parseNoteTagIds } from "@/lib/notes/note-tag-validation";
import { activeLibraryDocumentWhere } from "@/lib/library/document-list-scope";

export async function replaceDocumentTagsForUser(
  userId: string,
  documentId: string,
  rawTagIds: unknown,
): Promise<
  | { ok: true; tagIds: string[] }
  | { ok: false; reason: "not_found" | "invalid_tags" | "tag_not_found" }
> {
  const document = await prisma.document.findFirst({
    where: { id: documentId, ...activeLibraryDocumentWhere(userId) },
    select: { id: true },
  });
  if (!document) {
    return { ok: false, reason: "not_found" };
  }

  const parsed = parseNoteTagIds(rawTagIds);
  if (!parsed.success) {
    return { ok: false, reason: "invalid_tags" };
  }

  const tagIds = parsed.tagIds;
  if (tagIds.length > 0) {
    const owned = await tagIdsBelongToUser(tagIds, userId);
    if (!owned) {
      return { ok: false, reason: "tag_not_found" };
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.documentTag.deleteMany({ where: { documentId } });
    if (tagIds.length > 0) {
      await tx.documentTag.createMany({
        data: tagIds.map((tagId) => ({ documentId, tagId })),
      });
    }
  });

  return { ok: true, tagIds };
}

export const documentTagSelect = {
  documentTags: {
    select: {
      tag: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
} satisfies Prisma.DocumentInclude;

export function serializeDocumentTags(
  documentTags: Array<{ tag: { id: string; name: string } }>,
) {
  return documentTags
    .map((row) => row.tag)
    .sort((a, b) => a.name.localeCompare(b.name));
}
