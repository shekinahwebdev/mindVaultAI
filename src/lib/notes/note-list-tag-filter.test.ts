import "dotenv/config";

import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { NoteType } from "@/generated/prisma/enums";
import { parseNotesListQuery } from "@/lib/note-validation";
import { prisma } from "@/lib/db";
import { createTagForUser } from "@/lib/tags/tag-repository";

import { createNoteWithTags } from "./note-tags-repository";
import { serializeNote } from "./serialize";
import { buildNotesListWhere } from "./list-query";

const runIntegration = Boolean(process.env.DATABASE_URL);

describe("notes list tagId filter", { skip: !runIntegration }, () => {
  let userId = "";
  let tagPythonId = "";
  let tagBackendId = "";
  let noteAId = "";
  let noteBId = "";
  let noteCId = "";

  before(async () => {
    const user = await prisma.user.create({
      data: { email: `note-filter-${Date.now()}@example.com`, passwordHash: "x" },
    });
    userId = user.id;

    const py = await createTagForUser(userId, "Python");
    const be = await createTagForUser(userId, "Backend");
    assert.ok(py.ok && be.ok);
    tagPythonId = py.tag.id;
    tagBackendId = be.tag.id;

    const noteA = await createNoteWithTags(
      userId,
      {
        title: "Python Exceptions",
        content: "try except",
        type: NoteType.NOTE,
        sourceUrl: null,
        categoryId: null,
      },
      [tagPythonId],
    );
    const noteB = await createNoteWithTags(
      userId,
      {
        title: "FastAPI Authentication",
        content: "oauth flows",
        type: NoteType.NOTE,
        sourceUrl: null,
        categoryId: null,
      },
      [tagPythonId, tagBackendId],
    );
    const noteC = await createNoteWithTags(
      userId,
      {
        title: "Backend only",
        content: "servers",
        type: NoteType.NOTE,
        sourceUrl: null,
        categoryId: null,
      },
      [tagBackendId],
    );

    noteAId = serializeNote(noteA).id;
    noteBId = serializeNote(noteB).id;
    noteCId = serializeNote(noteC).id;
  });

  after(async () => {
    if (userId) await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await prisma.$disconnect();
  });

  it("parses tagId query param", () => {
    const query = parseNotesListQuery(
      new URLSearchParams(`tagId=${tagPythonId}&q=exceptions`),
    );
    assert.equal(query.tagId, tagPythonId);
    assert.equal(query.search, "exceptions");
  });

  it("filters notes by tag and search", async () => {
    const baseQuery = parseNotesListQuery(
      new URLSearchParams(`tagId=${tagPythonId}`),
    );
    const where = buildNotesListWhere(userId, baseQuery);
    const notes = await prisma.note.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true },
    });
    const ids = notes.map((note) => note.id).sort();
    assert.deepEqual(ids, [noteAId, noteBId].sort());

    const searchQuery = parseNotesListQuery(
      new URLSearchParams(`tagId=${tagPythonId}&q=exceptions`),
    );
    const searchWhere = buildNotesListWhere(userId, searchQuery);
    const searched = await prisma.note.findMany({
      where: searchWhere,
      select: { id: true },
    });
    assert.deepEqual(
      searched.map((note) => note.id),
      [noteAId],
    );
    assert.ok(!searched.some((note) => note.id === noteCId));
  });
});
