import "dotenv/config";

import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { NoteType } from "@/generated/prisma/enums";
import { UNAUTHORIZED_MESSAGE } from "@/lib/auth/guards";
import type { SessionData } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

import {
  handleCreateTag,
  handleDeleteTag,
  handleGetTag,
  handleListTags,
  handleRenameTag,
} from "./tag-api-handlers";
import { TAG_DUPLICATE_MESSAGE } from "./tag-errors";

const runIntegration = Boolean(process.env.DATABASE_URL);

async function readJson(response: Response) {
  return {
    status: response.status,
    body: (await response.json()) as Record<string, unknown>,
  };
}

describe("tag API handlers", { skip: !runIntegration }, () => {
  const suffix = Date.now();
  const emailA = `tag-api-a-${suffix}@example.com`;
  const emailB = `tag-api-b-${suffix}@example.com`;

  let userAId = "";
  let userBId = "";
  const sessionA: SessionData = {
    userId: "",
    email: emailA,
    name: "API A",
  };
  const sessionB: SessionData = {
    userId: "",
    email: emailB,
    name: "API B",
  };

  before(async () => {
    const [userA, userB] = await Promise.all([
      prisma.user.create({
        data: { email: emailA, passwordHash: "test", name: "API A" },
      }),
      prisma.user.create({
        data: { email: emailB, passwordHash: "test", name: "API B" },
      }),
    ]);
    userAId = userA.id;
    userBId = userB.id;
    sessionA.userId = userAId;
    sessionB.userId = userBId;
  });

  after(async () => {
    if (userAId) await prisma.user.delete({ where: { id: userAId } }).catch(() => {});
    if (userBId) await prisma.user.delete({ where: { id: userBId } }).catch(() => {});
    await prisma.$disconnect();
  });

  it("returns 401 when unauthenticated", async () => {
    const list = await readJson(await handleListTags(null, new URL("http://local/api/tags")));
    assert.equal(list.status, 401);
    assert.equal(list.body.message, UNAUTHORIZED_MESSAGE);

    const create = await readJson(await handleCreateTag(null, { name: "X" }));
    assert.equal(create.status, 401);

    const get = await readJson(await handleGetTag(null, "fake-id"));
    assert.equal(get.status, 401);

    const patch = await readJson(await handleRenameTag(null, "fake-id", { name: "Y" }));
    assert.equal(patch.status, 401);

    const del = await readJson(await handleDeleteTag(null, "fake-id"));
    assert.equal(del.status, 401);
  });

  it("creates tag with 201 and rejects duplicates with 409", async () => {
    const created = await readJson(
      await handleCreateTag(sessionA, { name: "Programming" }),
    );
    assert.equal(created.status, 201);
    assert.equal(created.body.ok, true);

    for (const variant of ["programming", " PROGRAMMING ", "Programming"]) {
      const dup = await readJson(await handleCreateTag(sessionA, { name: variant }));
      assert.equal(dup.status, 409);
      assert.equal(dup.body.message, TAG_DUPLICATE_MESSAGE);
      const errors = dup.body.errors as { name?: string };
      assert.equal(errors.name, TAG_DUPLICATE_MESSAGE);
    }

    const otherUser = await readJson(
      await handleCreateTag(sessionB, { name: "Programming" }),
    );
    assert.equal(otherUser.status, 201);
  });

  it("validates create input with 400", async () => {
    const empty = await readJson(await handleCreateTag(sessionA, { name: "   " }));
    assert.equal(empty.status, 400);

    const long = await readJson(
      await handleCreateTag(sessionA, { name: "x".repeat(49) }),
    );
    assert.equal(long.status, 400);
  });

  it("lists only the current user's tags with stats and insights", async () => {
    await handleCreateTag(sessionA, { name: "AlphaProg" });
    await handleCreateTag(sessionA, { name: "BetaWork" });

    const listA = await readJson(
      await handleListTags(sessionA, new URL("http://local/api/tags")),
    );
    assert.equal(listA.status, 200);
    const namesA = (listA.body.tags as Array<{ name: string }>).map((t) => t.name);
    assert.ok(namesA.includes("AlphaProg"));
    assert.ok(namesA.includes("BetaWork"));
    assert.ok(listA.body.stats);
    assert.ok(Array.isArray(listA.body.insights));

    const listB = await readJson(
      await handleListTags(sessionB, new URL("http://local/api/tags")),
    );
    const namesB = (listB.body.tags as Array<{ name: string }>).map((t) => t.name);
    assert.ok(!namesB.includes("AlphaProg"));
  });

  it("supports search, sort, filter, and invalid query params", async () => {
    const search = await readJson(
      await handleListTags(
        sessionA,
        new URL("http://local/api/tags?q=prog&sort=name_asc&filter=used"),
      ),
    );
    assert.equal(search.status, 200);

    const badSort = await readJson(
      await handleListTags(
        sessionA,
        new URL("http://local/api/tags?sort=not_a_sort"),
      ),
    );
    assert.equal(badSort.status, 400);

    for (const sort of [
      "most_used",
      "least_used",
      "name_desc",
      "newest",
    ] as const) {
      const res = await readJson(
        await handleListTags(
          sessionA,
          new URL(`http://local/api/tags?sort=${sort}`),
        ),
      );
      assert.equal(res.status, 200);
    }

    const unused = await readJson(
      await handleListTags(
        sessionA,
        new URL("http://local/api/tags?filter=unused"),
      ),
    );
    assert.equal(unused.status, 200);
  });

  it("gets, renames, and deletes owned tags; hides other users' tags", async () => {
    const created = await readJson(
      await handleCreateTag(sessionA, { name: "OwnedTag" }),
    );
    assert.equal(created.status, 201);
    const tag = created.body.tag as { id: string; name: string; noteCount: number };

    const getOwned = await readJson(await handleGetTag(sessionA, tag.id));
    assert.equal(getOwned.status, 200);

    const getOther = await readJson(await handleGetTag(sessionB, tag.id));
    assert.equal(getOther.status, 404);

    const renamed = await readJson(
      await handleRenameTag(sessionA, tag.id, { name: "OwnedTag Renamed" }),
    );
    assert.equal(renamed.status, 200);
    const renamedTag = renamed.body.tag as { id: string; name: string };
    assert.equal(renamedTag.id, tag.id);
    assert.equal(renamedTag.name, "OwnedTag Renamed");

    const dupRename = await readJson(
      await handleRenameTag(sessionA, tag.id, { name: "Programming" }),
    );
    assert.equal(dupRename.status, 409);

    const patchOther = await readJson(
      await handleRenameTag(sessionB, tag.id, { name: "Stolen" }),
    );
    assert.equal(patchOther.status, 404);

    const deleted = await readJson(await handleDeleteTag(sessionA, tag.id));
    assert.equal(deleted.status, 200);
    assert.equal(deleted.body.ok, true);

    const deleteOther = await readJson(await handleDeleteTag(sessionB, tag.id));
    assert.equal(deleteOther.status, 404);
  });

  it("delete via API preserves notes; rename preserves joins", async () => {
    const created = await readJson(
      await handleCreateTag(sessionA, { name: "JoinTag" }),
    );
    const tag = created.body.tag as { id: string; noteCount: number };

    const note = await prisma.note.create({
      data: {
        userId: userAId,
        title: "Keep me",
        content: "body",
        type: NoteType.NOTE,
      },
    });

    await prisma.noteTag.create({ data: { noteId: note.id, tagId: tag.id } });

    const renamed = await readJson(
      await handleRenameTag(sessionA, tag.id, { name: "JoinTag Renamed" }),
    );
    assert.equal(renamed.status, 200);
    const afterRename = renamed.body.tag as { id: string; noteCount: number };
    assert.equal(afterRename.id, tag.id);
    assert.equal(afterRename.noteCount, 1);

    const joinBeforeDelete = await prisma.noteTag.findUnique({
      where: { noteId_tagId: { noteId: note.id, tagId: tag.id } },
    });
    assert.ok(joinBeforeDelete);

    const deleted = await readJson(await handleDeleteTag(sessionA, tag.id));
    assert.equal(deleted.status, 200);

    const noteStill = await prisma.note.findUnique({ where: { id: note.id } });
    assert.ok(noteStill);

    const joinAfter = await prisma.noteTag.count({ where: { noteId: note.id } });
    assert.equal(joinAfter, 0);

    await prisma.note.delete({ where: { id: note.id } });
  });

  it("stats reflect real counts for tagged setup", async () => {
    const a = await readJson(await handleCreateTag(sessionA, { name: "StatTagA" }));
    const b = await readJson(await handleCreateTag(sessionA, { name: "StatTagB" }));
    const c = await readJson(await handleCreateTag(sessionA, { name: "StatTagC" }));
    const tagA = (a.body.tag as { id: string }).id;
    const tagB = (b.body.tag as { id: string }).id;

    const notes = await Promise.all(
      Array.from({ length: 4 }, (_, i) =>
        prisma.note.create({
          data: {
            userId: userAId,
            title: `S${i}`,
            content: "c",
            type: NoteType.NOTE,
          },
        }),
      ),
    );

    await prisma.noteTag.createMany({
      data: [
        { noteId: notes[0]!.id, tagId: tagA },
        { noteId: notes[1]!.id, tagId: tagA },
        { noteId: notes[2]!.id, tagId: tagA },
        { noteId: notes[0]!.id, tagId: tagB },
      ],
    });

    const list = await readJson(
      await handleListTags(sessionA, new URL("http://local/api/tags")),
    );
    const stats = list.body.stats as {
      totalTags: number;
      unusedTags: number;
      mostUsedTag: { name: string; noteCount: number } | null;
    };

    assert.ok(stats.totalTags >= 3);
    assert.ok(stats.unusedTags >= 1);
    assert.equal(stats.mostUsedTag?.name, "StatTagA");
    assert.equal(stats.mostUsedTag?.noteCount, 3);

    await Promise.all(notes.map((n) => prisma.note.delete({ where: { id: n.id } })));
    await handleDeleteTag(sessionA, tagA);
    await handleDeleteTag(sessionA, tagB);
    await handleDeleteTag(sessionA, (c.body.tag as { id: string }).id);
  });

  it("manual-style flow: create, list, rename, search, delete", async () => {
    const name = `FlowTag-${suffix}`;
    const created = await readJson(await handleCreateTag(sessionA, { name }));
    assert.equal(created.status, 201);
    const id = (created.body.tag as { id: string }).id;

    const listed = await readJson(
      await handleListTags(
        sessionA,
        new URL(`http://local/api/tags?q=${encodeURIComponent(name)}`),
      ),
    );
    const found = (listed.body.tags as Array<{ id: string }>).some((t) => t.id === id);
    assert.ok(found);

    await readJson(
      await handleRenameTag(sessionA, id, { name: `${name}-Renamed` }),
    );

    const gone = await readJson(await handleDeleteTag(sessionA, id));
    assert.equal(gone.status, 200);

    const after = await readJson(await handleGetTag(sessionA, id));
    assert.equal(after.status, 404);
  });
});
