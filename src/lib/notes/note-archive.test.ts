import "dotenv/config";

import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { NoteType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { buildNotesListWhere } from "@/lib/notes/list-query";
import { parseNotesListQuery } from "@/lib/note-validation";
import {
  archiveNoteForUser,
  emptyArchivedNotesForUser,
  listArchivedNotesForUser,
  restoreNoteForUser,
} from "@/lib/notes/archive-repository";
import { createNoteWithTags } from "@/lib/notes/note-tags-repository";
import { createTagForUser } from "@/lib/tags/tag-repository";
import { serializeTag, tagSelect } from "@/lib/tags/serialize";

const runIntegration = Boolean(process.env.DATABASE_URL);

describe("note archive", { skip: !runIntegration }, () => {
  let userA = "";
  let userB = "";
  let noteActiveId = "";
  let noteArchivedId = "";
  let tagId = "";

  before(async () => {
    const a = await prisma.user.create({
      data: { email: `arch-a-${Date.now()}@example.com`, passwordHash: "x" },
    });
    const b = await prisma.user.create({
      data: { email: `arch-b-${Date.now()}@example.com`, passwordHash: "x" },
    });
    userA = a.id;
    userB = b.id;

    const tag = await createTagForUser(userA, "ArchiveTest");
    assert.ok(tag.ok);
    tagId = tag.tag.id;

    const active = await createNoteWithTags(
      userA,
      {
        title: "Active JWT note",
        content: "active secret token",
        type: NoteType.NOTE,
        sourceUrl: null,
        categoryId: null,
      },
      [tagId],
    );
    const archived = await createNoteWithTags(
      userA,
      {
        title: "Archived JWT note",
        content: "archived secret token",
        type: NoteType.NOTE,
        sourceUrl: null,
        categoryId: null,
      },
      [tagId],
    );
    noteActiveId = active.id;
    noteArchivedId = archived.id;
    await archiveNoteForUser(userA, noteArchivedId);

    await createNoteWithTags(
      userB,
      {
        title: "B archived",
        content: "b",
        type: NoteType.NOTE,
        sourceUrl: null,
        categoryId: null,
      },
      [],
    ).then(async (note) => {
      await archiveNoteForUser(userB, note.id);
    });
  });

  after(async () => {
    await prisma.user.deleteMany({ where: { id: { in: [userA, userB] } } });
  });

  it("excludes archived notes from active list queries", async () => {
    const where = buildNotesListWhere(userA, parseNotesListQuery(new URLSearchParams()));
    const ids = (
      await prisma.note.findMany({ where, select: { id: true } })
    ).map((row) => row.id);
    assert.ok(ids.includes(noteActiveId));
    assert.ok(!ids.includes(noteArchivedId));
  });

  it("returns archived notes only from archive list with search", async () => {
    const archived = await listArchivedNotesForUser(userA, {
      sort: "recently_archived",
      search: "JWT",
    });
    assert.equal(archived.length, 1);
    assert.equal(archived[0]?.id, noteArchivedId);

    const activeSearch = await prisma.note.findMany({
      where: buildNotesListWhere(userA, {
        ...parseNotesListQuery(new URLSearchParams("q=JWT")),
      }),
      select: { id: true },
    });
    assert.equal(activeSearch.length, 1);
    assert.equal(activeSearch[0]?.id, noteActiveId);
  });

  it("restore clears archivedAt and preserves tags", async () => {
    const restored = await restoreNoteForUser(userA, noteArchivedId);
    assert.ok(restored);
    assert.equal(restored.archivedAt, null);

    const tag = await prisma.tag.findFirst({
      where: { id: tagId, userId: userA },
      select: tagSelect,
    });
    assert.ok(tag);
    assert.equal(serializeTag(tag).noteCount, 2);
  });

  it("empty archive deletes only current user archived notes", async () => {
    const disposable = await createNoteWithTags(
      userA,
      {
        title: "Disposable archived",
        content: "delete me",
        type: NoteType.NOTE,
        sourceUrl: null,
        categoryId: null,
      },
      [],
    );
    await archiveNoteForUser(userA, disposable.id);

    const keeper = await createNoteWithTags(
      userA,
      {
        title: "Keeper active",
        content: "stay",
        type: NoteType.NOTE,
        sourceUrl: null,
        categoryId: null,
      },
      [],
    );

    const deleted = await emptyArchivedNotesForUser(userA);
    assert.ok(deleted >= 1);

    const keeperRow = await prisma.note.findUnique({
      where: { id: keeper.id },
      select: { archivedAt: true },
    });
    assert.ok(keeperRow);
    assert.equal(keeperRow.archivedAt, null);

    const bArchived = await prisma.note.count({
      where: { userId: userB, archivedAt: { not: null } },
    });
    assert.equal(bArchived, 1);
  });
});
