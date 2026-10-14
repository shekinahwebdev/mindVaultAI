import { prisma } from "@/lib/db";
import { activeLibraryDocumentWhere } from "@/lib/library/document-list-scope";
import { activeNoteWhere } from "@/lib/notes/note-scope";

import { serializeCollection, type SerializedCollection } from "./collection-serialize";

export async function listCollectionsForUser(userId: string): Promise<SerializedCollection[]> {
  const rows = await prisma.collection.findMany({
    where: { userId },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    include: {
      _count: { select: { items: true } },
    },
  });

  return rows.map((row) => serializeCollection(row, row._count.items));
}

export async function getCollectionForUser(userId: string, collectionId: string) {
  return prisma.collection.findFirst({
    where: { id: collectionId, userId },
    include: {
      _count: { select: { items: true } },
    },
  });
}

export async function createCollectionForUser(
  userId: string,
  name: string,
  description: string | null,
): Promise<SerializedCollection | { ok: false; reason: "duplicate_name" }> {
  try {
    const row = await prisma.collection.create({
      data: {
        userId,
        name,
        description,
      },
      include: { _count: { select: { items: true } } },
    });
    return serializeCollection(row, row._count.items);
  } catch {
    return { ok: false, reason: "duplicate_name" };
  }
}

export async function updateCollectionForUser(
  userId: string,
  collectionId: string,
  data: { name?: string; description?: string | null },
): Promise<SerializedCollection | null | { ok: false; reason: "duplicate_name" }> {
  const owned = await getCollectionForUser(userId, collectionId);
  if (!owned) {
    return null;
  }

  try {
    const row = await prisma.collection.update({
      where: { id: collectionId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
      },
      include: { _count: { select: { items: true } } },
    });
    return serializeCollection(row, row._count.items);
  } catch {
    return { ok: false, reason: "duplicate_name" };
  }
}

export async function deleteCollectionForUser(userId: string, collectionId: string): Promise<boolean> {
  const result = await prisma.collection.deleteMany({
    where: { id: collectionId, userId },
  });
  return result.count > 0;
}

async function noteEligibleForCollection(userId: string, noteId: string) {
  return prisma.note.findFirst({
    where: { id: noteId, ...activeNoteWhere(userId) },
    select: { id: true },
  });
}

async function documentEligibleForCollection(userId: string, documentId: string) {
  return prisma.document.findFirst({
    where: { id: documentId, ...activeLibraryDocumentWhere(userId) },
    select: { id: true },
  });
}

export async function addCollectionItemForUser(
  userId: string,
  collectionId: string,
  kind: "note" | "document",
  itemId: string,
): Promise<
  | { ok: true }
  | { ok: false; reason: "not_found" | "item_not_found" | "invalid_item" }
> {
  const collection = await getCollectionForUser(userId, collectionId);
  if (!collection) {
    return { ok: false, reason: "not_found" };
  }

  if (kind === "note") {
    const note = await noteEligibleForCollection(userId, itemId);
    if (!note) {
      return { ok: false, reason: "item_not_found" };
    }
    await prisma.collectionItem.upsert({
      where: {
        collectionId_noteId: { collectionId, noteId: itemId },
      },
      create: { collectionId, noteId: itemId },
      update: {},
    });
    return { ok: true };
  }

  const document = await documentEligibleForCollection(userId, itemId);
  if (!document) {
    return { ok: false, reason: "item_not_found" };
  }
  await prisma.collectionItem.upsert({
    where: {
      collectionId_documentId: { collectionId, documentId: itemId },
    },
    create: { collectionId, documentId: itemId },
    update: {},
  });
  return { ok: true };
}

export async function removeCollectionItemForUser(
  userId: string,
  collectionId: string,
  kind: "note" | "document",
  itemId: string,
): Promise<boolean> {
  const collection = await getCollectionForUser(userId, collectionId);
  if (!collection) {
    return false;
  }

  if (kind === "note") {
    const result = await prisma.collectionItem.deleteMany({
      where: { collectionId, noteId: itemId },
    });
    return result.count > 0;
  }

  const result = await prisma.collectionItem.deleteMany({
    where: { collectionId, documentId: itemId },
  });
  return result.count > 0;
}
