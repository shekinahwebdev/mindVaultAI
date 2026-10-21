import "dotenv/config";

import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { DocumentStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { createTagForUser } from "@/lib/tags/tag-repository";

import {
  addCollectionItemForUser,
  createCollectionForUser,
} from "@/lib/collections/collection-repository";
import { searchForUser } from "./search-repository";

const runIntegration = Boolean(process.env.DATABASE_URL);
let schemaReady = false;

function assertCollection<T extends { id: string }>(
  value: T | { ok: false; reason: string },
): asserts value is T {
  assert.ok("id" in value);
}

describe("searchForUser integration", { skip: !runIntegration }, () => {
  const suffix = Date.now();
  let userA = "";
  let userB = "";
  let noteId = "";
  let documentId = "";
  before(async () => {
    const columns = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'document_chunks'
        AND column_name = 'openai_embedding_model'
    `;
    if (columns.length === 0) {
      console.warn(
        "Skipping searchForUser integration: apply prisma migration 20261014140000_openai_embedding_columns",
      );
      return;
    }
    schemaReady = true;

    const [a, b] = await Promise.all([
      prisma.user.create({
        data: { email: `search-a-${suffix}@example.com`, passwordHash: "x" },
      }),
      prisma.user.create({
        data: { email: `search-b-${suffix}@example.com`, passwordHash: "x" },
      }),
    ]);
    userA = a.id;
    userB = b.id;

    const note = await prisma.note.create({
      data: {
        userId: userA,
        title: "NestJS Authentication Guide",
        content: "JWT middleware and guards for APIs",
        type: "NOTE",
      },
    });
    noteId = note.id;

    const doc = await prisma.document.create({
      data: {
        userId: userA,
        title: "Alpha PDF Security",
        originalFilename: "alpha-security.pdf",
        mimeType: "application/pdf",
        sizeBytes: 500,
        storageKey: `search-test/${suffix}.pdf`,
        status: DocumentStatus.READY,
        uploadExpiresAt: new Date(Date.now() + 86_400_000),
      },
    });
    documentId = doc.id;

    await prisma.documentChunk.create({
      data: {
        documentId,
        processingVersion: 1,
        chunkIndex: 0,
        content: "OAuth2 flows and refresh tokens in enterprise PDFs",
        pageStart: 4,
        pageEnd: 4,
        characterCount: 50,
      },
    });

    const tag = await createTagForUser(userA, "SearchTag");
    assert.ok(tag.ok);
  });

  after(async () => {
    if (userA) await prisma.user.delete({ where: { id: userA } }).catch(() => {});
    if (userB) await prisma.user.delete({ where: { id: userB } }).catch(() => {});
    await prisma.$disconnect();
  });

  it("keyword search finds notes and PDF metadata/body without cross-user leakage", async (t) => {
    if (!schemaReady) return t.skip("OpenAI embedding columns migration not applied");
    const result = await searchForUser(userA, {
      q: "JWT",
      mode: "keyword",
      type: "all",
      tagId: null,
      collectionId: null,
      page: 1,
      limit: 20,
      skip: 0,
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.ok(result.result.items.some((item) => item.kind === "note" && item.id === noteId));

    const pdf = await searchForUser(userA, {
      q: "OAuth2",
      mode: "keyword",
      type: "document",
      tagId: null,
      collectionId: null,
      page: 1,
      limit: 20,
      skip: 0,
    });
    assert.equal(pdf.ok, true);
    if (!pdf.ok) return;
    assert.ok(pdf.result.items.some((item) => item.kind === "document" && item.id === documentId));
    const match = pdf.result.items.find((item) => item.id === documentId);
    assert.equal(match?.pageStart, 4);

    const foreign = await searchForUser(userB, {
      q: "JWT",
      mode: "keyword",
      type: "all",
      tagId: null,
      collectionId: null,
      page: 1,
      limit: 20,
      skip: 0,
    });
    assert.equal(foreign.ok, true);
    if (!foreign.ok) return;
    assert.equal(foreign.result.items.length, 0);
  });

  it("excludes non-READY documents from keyword search", async (t) => {
    if (!schemaReady) return t.skip("OpenAI embedding columns migration not applied");
    const pending = await prisma.document.create({
      data: {
        userId: userA,
        title: "Pending OAuth2 Draft",
        originalFilename: "pending.pdf",
        mimeType: "application/pdf",
        sizeBytes: 100,
        storageKey: `search-pending/${suffix}.pdf`,
        status: DocumentStatus.PROCESSING,
        uploadExpiresAt: new Date(Date.now() + 86_400_000),
      },
    });

    const result = await searchForUser(userA, {
      q: "Pending OAuth2",
      mode: "keyword",
      type: "document",
      tagId: null,
      collectionId: null,
      page: 1,
      limit: 20,
      skip: 0,
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(
      result.result.items.some((item) => item.id === pending.id),
      false,
    );
  });

  it("returns empty for invalid collection filter without error", async (t) => {
    if (!schemaReady) return t.skip("OpenAI embedding columns migration not applied");
    const result = await searchForUser(userA, {
      q: "JWT",
      mode: "keyword",
      type: "all",
      tagId: null,
      collectionId: "nonexistent-collection",
      page: 1,
      limit: 20,
      skip: 0,
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.result.items.length, 0);
  });

  it("filters by collection membership", async (t) => {
    if (!schemaReady) return t.skip("OpenAI embedding columns migration not applied");
    const collection = await createCollectionForUser(userA, `SearchColl-${suffix}`, null);
    assertCollection(collection);
    await addCollectionItemForUser(userA, collection.id, "note", noteId);

    const inCollection = await searchForUser(userA, {
      q: "NestJS",
      mode: "keyword",
      type: "note",
      tagId: null,
      collectionId: collection.id,
      page: 1,
      limit: 20,
      skip: 0,
    });
    assert.equal(inCollection.ok, true);
    if (!inCollection.ok) return;
    assert.ok(inCollection.result.items.some((item) => item.id === noteId));

    await prisma.collection.delete({ where: { id: collection.id } });
  });
});
