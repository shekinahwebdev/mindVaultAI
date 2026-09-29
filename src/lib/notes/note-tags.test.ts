import "dotenv/config";

import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { NoteType } from "@/generated/prisma/enums";
import { parseCreateNoteBody, parseUpdateNoteBody } from "@/lib/note-validation";
import { prisma } from "@/lib/db";
import { createTagForUser } from "@/lib/tags/tag-repository";

import {
  createNoteWithTags,
  updateNoteWithOptionalTags,
} from "./note-tags-repository";
import { serializeNote } from "./serialize";
import { tagIdsBelongToUser } from "./tag-ownership";

const runIntegration = Boolean(process.env.DATABASE_URL);

describe("note tag assignment", { skip: !runIntegration }, () => {
  const suffix = Date.now();
  let userAId = "";
  let userBId = "";
  let tagPythonId = "";
  let tagBackendId = "";
  let tagLearningId = "";
  let tagOtherUserId = "";

  before(async () => {
    const [userA, userB] = await Promise.all([
      prisma.user.create({
        data: { email: `note-tags-a-${suffix}@example.com`, passwordHash: "x" },
      }),
      prisma.user.create({
        data: { email: `note-tags-b-${suffix}@example.com`, passwordHash: "x" },
      }),
    ]);
    userAId = userA.id;
    userBId = userB.id;

    const py = await createTagForUser(userAId, "Python");
    const be = await createTagForUser(userAId, "Backend");
    const le = await createTagForUser(userAId, "Learning");
    const other = await createTagForUser(userBId, "Python");

    assert.ok(py.ok && be.ok && le.ok && other.ok);
    tagPythonId = py.tag.id;
    tagBackendId = be.tag.id;
    tagLearningId = le.tag.id;
    tagOtherUserId = other.tag.id;
  });

  after(async () => {
    if (userAId) await prisma.user.delete({ where: { id: userAId } }).catch(() => {});
    if (userBId) await prisma.user.delete({ where: { id: userBId } }).catch(() => {});
    await prisma.$disconnect();
  });

  it("creates note with multiple tags in one transaction", async () => {
    const record = await createNoteWithTags(
      userAId,
      {
        title: "Python Exception Handling",
        content: "try/except",
        type: NoteType.NOTE,
        sourceUrl: null,
        categoryId: null,
      },
      [tagPythonId, tagLearningId],
    );

    const note = serializeNote(record);
    assert.deepEqual(
      note.tags.map((tag) => tag.name).sort(),
      ["Learning", "Python"],
    );

    const joins = await prisma.noteTag.count({ where: { noteId: note.id } });
    assert.equal(joins, 2);
  });

  it("validates tag ownership", async () => {
    assert.equal(await tagIdsBelongToUser([tagPythonId], userAId), true);
    assert.equal(await tagIdsBelongToUser([tagOtherUserId], userAId), false);
  });

  it("replaces and clears tags on update", async () => {
    const record = await createNoteWithTags(
      userAId,
      {
        title: "Update tags",
        content: "body",
        type: NoteType.NOTE,
        sourceUrl: null,
        categoryId: null,
      },
      [tagPythonId, tagLearningId],
    );

    const replaced = await updateNoteWithOptionalTags(
      record.id,
      {},
      [tagBackendId, tagLearningId],
    );

    const note = serializeNote(replaced);
    assert.deepEqual(
      note.tags.map((tag) => tag.name).sort(),
      ["Backend", "Learning"],
    );

    const cleared = await updateNoteWithOptionalTags(record.id, {}, []);
    assert.equal(serializeNote(cleared).tags.length, 0);
    assert.equal(await prisma.noteTag.count({ where: { noteId: record.id } }), 0);
  });

  it("leaves tags unchanged when tagIds omitted", async () => {
    const record = await createNoteWithTags(
      userAId,
      {
        title: "Keep tags",
        content: "body",
        type: NoteType.NOTE,
        sourceUrl: null,
        categoryId: null,
      },
      [tagPythonId],
    );

    const updated = await updateNoteWithOptionalTags(
      record.id,
      { title: "Keep tags renamed" },
      undefined,
    );

    assert.equal(serializeNote(updated).tags[0]?.name, "Python");
  });

  it("cascades note delete and tag delete correctly", async () => {
    const record = await createNoteWithTags(
      userAId,
      {
        title: "Delete me",
        content: "body",
        type: NoteType.NOTE,
        sourceUrl: null,
        categoryId: null,
      },
      [tagPythonId],
    );

    await prisma.note.delete({ where: { id: record.id } });
    assert.equal(await prisma.noteTag.count({ where: { noteId: record.id } }), 0);
    assert.ok(await prisma.tag.findFirst({ where: { id: tagPythonId } }));

    const temp = await createNoteWithTags(
      userAId,
      {
        title: "Tag delete",
        content: "body",
        type: NoteType.NOTE,
        sourceUrl: null,
        categoryId: null,
      },
      [tagBackendId],
    );

    await prisma.tag.delete({ where: { id: tagBackendId } });
    const noteAfter = await prisma.note.findFirstOrThrow({
      where: { id: temp.id },
      select: { id: true },
    });
    assert.ok(noteAfter);
    assert.equal(await prisma.noteTag.count({ where: { noteId: temp.id } }), 0);
  });

  it("parses tagIds on create/update payloads", () => {
    const create = parseCreateNoteBody({
      title: "T",
      content: "C",
      type: NoteType.NOTE,
      tagIds: [tagPythonId, tagPythonId],
    });
    assert.equal(create.success, true);
    if (create.success) {
      assert.deepEqual(create.data.tagIds, [tagPythonId]);
    }

    const clear = parseUpdateNoteBody({ tagIds: [] });
    assert.equal(clear.success, true);
    if (clear.success) {
      assert.deepEqual(clear.data.tagIds, []);
    }

    const bad = parseUpdateNoteBody({ tagIds: "nope" });
    assert.equal(bad.success, false);
  });
});
