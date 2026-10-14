import "dotenv/config";

import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { DocumentStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";

import { libraryRepositoryInternals, listLibraryForUser } from "./library-repository";

const runIntegration = Boolean(process.env.DATABASE_URL);

describe("library repository scope helpers", () => {
  it("scopes notes and documents to active library rows", () => {
    const noteWhere = libraryRepositoryInternals.buildNoteSearchWhere("user-1", null);
    assert.deepEqual(noteWhere, libraryRepositoryInternals.activeNoteWhere("user-1"));

    const docWhere = {
      ...libraryRepositoryInternals.activeLibraryDocumentWhere("user-1"),
      ...libraryRepositoryInternals.buildDocumentSearchWhere("pdf"),
    };
    assert.equal(docWhere.userId, "user-1");
    assert.equal(docWhere.archivedAt, null);
  });
});

describe("listLibraryForUser integration", { skip: !runIntegration }, () => {
  let userA = "";
  let userB = "";

  before(async () => {
    const [a, b] = await Promise.all([
      prisma.user.create({
        data: { email: `library-a-${Date.now()}@example.com`, passwordHash: "x" },
      }),
      prisma.user.create({
        data: { email: `library-b-${Date.now()}@example.com`, passwordHash: "x" },
      }),
    ]);
    userA = a.id;
    userB = b.id;

    await prisma.note.create({
      data: {
        userId: userA,
        title: "Alpha note",
        content: "Shared keyword alpha",
        type: "NOTE",
      },
    });

    await prisma.note.create({
      data: {
        userId: userB,
        title: "Other user note",
        content: "alpha secret",
        type: "NOTE",
      },
    });

    await prisma.document.create({
      data: {
        userId: userA,
        title: "Alpha PDF",
        originalFilename: "alpha.pdf",
        mimeType: "application/pdf",
        sizeBytes: 1000,
        storageKey: `library-test/${Date.now()}-alpha.pdf`,
        status: DocumentStatus.READY,
        uploadExpiresAt: new Date(Date.now() + 86_400_000),
      },
    });
  });

  after(async () => {
    if (userA) {
      await prisma.user.delete({ where: { id: userA } }).catch(() => {});
    }
    if (userB) {
      await prisma.user.delete({ where: { id: userB } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  it("returns only the requesting user's mixed library items", async () => {
    const result = await listLibraryForUser(userA, {
      page: 1,
      limit: 20,
      skip: 0,
      type: "all",
      sort: "title_asc",
      search: null,
    });

    assert.ok(result.items.length >= 2);
    assert.ok(result.items.every((item) => item.title.toLowerCase().includes("alpha")));
    assert.equal(
      result.items.some((item) => item.title === "Other user note"),
      false,
    );
  });

  it("filters by content type and search query", async () => {
    const notesOnly = await listLibraryForUser(userA, {
      page: 1,
      limit: 20,
      skip: 0,
      type: "note",
      sort: "updated_desc",
      search: "keyword",
    });
    assert.ok(notesOnly.items.every((item) => item.kind === "note"));

    const docsOnly = await listLibraryForUser(userA, {
      page: 1,
      limit: 20,
      skip: 0,
      type: "document",
      sort: "updated_desc",
      search: "alpha.pdf",
    });
    assert.ok(docsOnly.items.every((item) => item.kind === "document"));
  });

  it("paginates with stable totals", async () => {
    const page1 = await listLibraryForUser(userA, {
      page: 1,
      limit: 1,
      skip: 0,
      type: "all",
      sort: "title_asc",
      search: null,
    });
    const page2 = await listLibraryForUser(userA, {
      page: 2,
      limit: 1,
      skip: 1,
      type: "all",
      sort: "title_asc",
      search: null,
    });

    assert.equal(page1.pagination.total, page2.pagination.total);
    assert.ok(page1.items.length === 1);
    if (page2.items.length === 1) {
      assert.notEqual(page1.items[0]?.id, page2.items[0]?.id);
    }
  });
});
