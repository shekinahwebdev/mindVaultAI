import "dotenv/config";

import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { NoteType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";

import {
  createTagForUser,
  deleteTagForUser,
  findTagForUser,
  getTagStatsForUser,
  getTopTagsForUser,
  listTagsForUser,
  renameTagForUser,
} from "./tag-repository";

const runIntegration = Boolean(process.env.DATABASE_URL);

describe("tag repository", { skip: !runIntegration }, () => {
  const suffix = Date.now();
  const emailA = `tag-repo-a-${suffix}@example.com`;
  const emailB = `tag-repo-b-${suffix}@example.com`;
  let userAId = "";
  let userBId = "";
  const noteIds: string[] = [];

  before(async () => {
    const [userA, userB] = await Promise.all([
      prisma.user.create({
        data: {
          email: emailA,
          passwordHash: "test-hash",
          name: "Tag Repo A",
        },
      }),
      prisma.user.create({
        data: {
          email: emailB,
          passwordHash: "test-hash",
          name: "Tag Repo B",
        },
      }),
    ]);
    userAId = userA.id;
    userBId = userB.id;
  });

  after(async () => {
    if (userAId) {
      await prisma.user.delete({ where: { id: userAId } }).catch(() => {});
    }
    if (userBId) {
      await prisma.user.delete({ where: { id: userBId } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  it("creates tag and rejects duplicate casing for same user", async () => {
    const first = await createTagForUser(userAId, "Programming");
    assert.equal(first.ok, true);

    for (const variant of ["programming", " PROGRAMMING ", "Programming"]) {
      const dup = await createTagForUser(userAId, variant);
      assert.equal(dup.ok, false);
      if (!dup.ok) {
        assert.equal(dup.code, "duplicate_tag");
      }
    }
  });

  it("allows same display name for different users", async () => {
    const other = await createTagForUser(userBId, "Programming");
    assert.equal(other.ok, true);
  });

  it("rename preserves note-tag relationships", async () => {
    const created = await createTagForUser(userAId, "RelTag");
    assert.equal(created.ok, true);
    if (!created.ok) return;

    const note = await prisma.note.create({
      data: {
        userId: userAId,
        title: "Tagged",
        content: "x",
        type: NoteType.NOTE,
      },
    });
    noteIds.push(note.id);

    await prisma.noteTag.create({
      data: { noteId: note.id, tagId: created.tag.id },
    });

    const renamed = await renameTagForUser(userAId, created.tag.id, "RelTag Renamed");
    assert.equal(renamed.ok, true);

    const join = await prisma.noteTag.findUnique({
      where: {
        noteId_tagId: { noteId: note.id, tagId: created.tag.id },
      },
    });
    assert.ok(join);

    const noteStill = await prisma.note.findUnique({ where: { id: note.id } });
    assert.ok(noteStill);
  });

  it("delete tag preserves notes and removes joins", async () => {
    const created = await createTagForUser(userAId, "DeleteMe");
    assert.equal(created.ok, true);
    if (!created.ok) return;

    const note = await prisma.note.create({
      data: {
        userId: userAId,
        title: "Keep",
        content: "y",
        type: NoteType.NOTE,
      },
    });
    noteIds.push(note.id);

    await prisma.noteTag.create({
      data: { noteId: note.id, tagId: created.tag.id },
    });

    const deleted = await deleteTagForUser(userAId, created.tag.id);
    assert.equal(deleted.ok, true);

    const noteStill = await prisma.note.findUnique({ where: { id: note.id } });
    assert.ok(noteStill);

    const joinCount = await prisma.noteTag.count({
      where: { tagId: created.tag.id },
    });
    assert.equal(joinCount, 0);
  });

  it("scopes find/rename/delete by user", async () => {
    const tagB = await createTagForUser(userBId, "OwnedByB");
    assert.equal(tagB.ok, true);
    if (!tagB.ok) return;

    assert.equal(await findTagForUser(userAId, tagB.tag.id), null);

    const rename = await renameTagForUser(userAId, tagB.tag.id, "Hijack");
    assert.equal(rename.ok, false);
    if (!rename.ok) assert.equal(rename.code, "tag_not_found");

    const del = await deleteTagForUser(userAId, tagB.tag.id);
    assert.equal(del.ok, false);
    if (!del.ok) assert.equal(del.code, "tag_not_found");
  });

  it("computes stats and top tags", async () => {
    const a = await createTagForUser(userAId, "StatA");
    const b = await createTagForUser(userAId, "StatB");
    const c = await createTagForUser(userAId, "StatC");
    assert.ok(a.ok && b.ok && c.ok);
    if (!a.ok || !b.ok || !c.ok) return;

    const mkNote = async () => {
      const note = await prisma.note.create({
        data: {
          userId: userAId,
          title: "n",
          content: "c",
          type: NoteType.NOTE,
        },
      });
      noteIds.push(note.id);
      return note.id;
    };

    const n1 = await mkNote();
    const n2 = await mkNote();
    const n3 = await mkNote();

    await prisma.noteTag.createMany({
      data: [
        { noteId: n1, tagId: a.tag.id },
        { noteId: n2, tagId: a.tag.id },
        { noteId: n3, tagId: a.tag.id },
        { noteId: n1, tagId: b.tag.id },
      ],
    });

    const stats = await getTagStatsForUser(userAId);
    assert.ok(stats.totalTags >= 3);
    assert.ok(stats.unusedTags >= 1);
    assert.equal(stats.mostUsedTag?.name, "StatA");
    assert.equal(stats.mostUsedTag?.noteCount, 3);

    const top = await getTopTagsForUser(userAId, 5);
    assert.equal(top[0]?.name, "StatA");
    assert.equal(top[0]?.noteCount, 3);
  });

  it("supports sort, filter, and search", async () => {
    await createTagForUser(userAId, "AlphaSearch");
    await createTagForUser(userAId, "BetaSearch");
    const unused = await createTagForUser(userAId, "ZeroUseTag");
    assert.ok(unused.ok);

    const most = await listTagsForUser(userAId, { sort: "most_used" });
    assert.ok(most.length > 0);
    assert.ok(most[0]!.noteCount >= (most.at(-1)?.noteCount ?? 0));

    const unusedOnly = await listTagsForUser(userAId, {
      filter: "unused",
      search: "ZeroUse",
    });
    assert.equal(unusedOnly.length, 1);
    assert.equal(unusedOnly[0]?.noteCount, 0);

    const usedOnly = await listTagsForUser(userAId, { filter: "used" });
    assert.ok(usedOnly.every((tag) => tag.noteCount > 0));

    const search = await listTagsForUser(userAId, {
      search: "betasearch",
      sort: "name_asc",
    });
    assert.equal(search.length, 1);
    assert.equal(search[0]?.name, "BetaSearch");

    const nameDesc = await listTagsForUser(userAId, { sort: "name_desc" });
    const names = nameDesc.map((t) => t.name);
    const sorted = [...names].sort((x, y) => y.localeCompare(x));
    assert.deepEqual(names, sorted);
  });
});
