import "dotenv/config";

import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { DocumentStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { replaceDocumentTagsForUser } from "@/lib/documents/document-tags-repository";
import { listLibraryForUser } from "@/lib/library/library-repository";
import { createTagForUser } from "@/lib/tags/tag-repository";

import {
  addCollectionItemForUser,
  createCollectionForUser,
  deleteCollectionForUser,
  listCollectionsForUser,
  removeCollectionItemForUser,
} from "./collection-repository";
import type { SerializedCollection } from "./collection-serialize";

const runIntegration = Boolean(process.env.DATABASE_URL);

function assertCollection(
  value: SerializedCollection | { ok: false; reason: "duplicate_name" },
): asserts value is SerializedCollection {
  assert.ok("id" in value, `expected collection row, got ${JSON.stringify(value)}`);
}

const libraryQueryBase = {
  page: 1,
  limit: 20,
  skip: 0,
  type: "all" as const,
  sort: "title_asc" as const,
  search: null,
  tagId: null,
  collectionId: null,
};

describe("collection repository", { skip: !runIntegration }, () => {
  const suffix = Date.now();
  let userA = "";
  let userB = "";
  let noteA = "";
  let documentA = "";
  let tagA = "";

  before(async () => {
    const [a, b] = await Promise.all([
      prisma.user.create({
        data: { email: `coll-a-${suffix}@example.com`, passwordHash: "x" },
      }),
      prisma.user.create({
        data: { email: `coll-b-${suffix}@example.com`, passwordHash: "x" },
      }),
    ]);
    userA = a.id;
    userB = b.id;

    const note = await prisma.note.create({
      data: { userId: userA, title: "Coll note", content: "body", type: "NOTE" },
    });
    noteA = note.id;

    const doc = await prisma.document.create({
      data: {
        userId: userA,
        title: "Coll PDF",
        originalFilename: "coll.pdf",
        mimeType: "application/pdf",
        sizeBytes: 500,
        storageKey: `coll-test/${suffix}.pdf`,
        status: DocumentStatus.READY,
        uploadExpiresAt: new Date(Date.now() + 86_400_000),
      },
    });
    documentA = doc.id;

    const tag = await createTagForUser(userA, "CollTag");
    assert.ok(tag.ok);
    tagA = tag.tag.id;
  });

  after(async () => {
    if (userA) await prisma.user.delete({ where: { id: userA } }).catch(() => {});
    if (userB) await prisma.user.delete({ where: { id: userB } }).catch(() => {});
    await prisma.$disconnect();
  });

  it("creates, lists, and deletes collections without removing content", async () => {
    const created = await createCollectionForUser(userA, "Research", "Notes and PDFs");
    assertCollection(created);
    assert.equal(created.name, "Research");

    const listed = await listCollectionsForUser(userA);
    assert.ok(listed.some((row) => row.id === created.id));

    const dup = await createCollectionForUser(userA, "Research", null);
    assert.ok("ok" in dup && dup.ok === false);

    const addedNote = await addCollectionItemForUser(userA, created.id, "note", noteA);
    assert.equal(addedNote.ok, true);
    const dupMembership = await addCollectionItemForUser(userA, created.id, "note", noteA);
    assert.equal(dupMembership.ok, true);

    const addedDoc = await addCollectionItemForUser(userA, created.id, "document", documentA);
    assert.equal(addedDoc.ok, true);

    const noteStill = await prisma.note.findUnique({ where: { id: noteA } });
    assert.ok(noteStill);

    const deleted = await deleteCollectionForUser(userA, created.id);
    assert.equal(deleted, true);
    assert.equal(await prisma.collectionItem.count({ where: { collectionId: created.id } }), 0);
    assert.ok(await prisma.note.findUnique({ where: { id: noteA } }));
  });

  it("blocks cross-user collection and item access", async () => {
    const collection = await createCollectionForUser(userA, `Private-${suffix}`, null);
    assertCollection(collection);

    const foreignAdd = await addCollectionItemForUser(userB, collection.id, "note", noteA);
    assert.equal(foreignAdd.ok, false);

    const foreignList = await listCollectionsForUser(userB);
    assert.equal(foreignList.some((row) => row.id === collection.id), false);

    await deleteCollectionForUser(userA, collection.id);
  });

  it("filters library by collection and tag without duplicates", async () => {
    const collection = await createCollectionForUser(userA, `Filter-${suffix}`, null);
    assertCollection(collection);
    await addCollectionItemForUser(userA, collection.id, "note", noteA);
    await addCollectionItemForUser(userA, collection.id, "document", documentA);

    const byCollection = await listLibraryForUser(userA, {
      ...libraryQueryBase,
      collectionId: collection.id,
    });
    assert.equal(byCollection.items.length, 2);
    const ids = new Set(byCollection.items.map((item) => `${item.kind}:${item.id}`));
    assert.equal(ids.size, 2);

    const tagged = await replaceDocumentTagsForUser(userA, documentA, [tagA]);
    assert.equal(tagged.ok, true);

    const byTag = await listLibraryForUser(userA, {
      ...libraryQueryBase,
      tagId: tagA,
    });
    assert.ok(byTag.items.some((item) => item.kind === "document" && item.id === documentA));

    const removed = await removeCollectionItemForUser(userA, collection.id, "note", noteA);
    assert.equal(removed, true);

    await deleteCollectionForUser(userA, collection.id);
  });

  it("rejects assigning another user's tags to a document", async () => {
    const otherTag = await createTagForUser(userB, "Foreign");
    assert.ok(otherTag.ok);
    const result = await replaceDocumentTagsForUser(userA, documentA, [otherTag.tag.id]);
    assert.equal(result.ok, false);
    assert.equal(result.reason, "tag_not_found");
  });
});
