import "dotenv/config";

import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { DocumentStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { PLAN_LIMITS } from "@/lib/billing/plans";
import { ensureFreeSubscriptionForNewUser } from "@/lib/billing/subscription-repository";
import type { DocumentS3Adapter } from "@/lib/storage/s3/types";

import {
  completeDocumentUpload,
  deleteDocumentForUser,
  initiateDocumentUpload,
  retryDocumentUpload,
} from "./upload-lifecycle";

const runIntegration = Boolean(process.env.DATABASE_URL);
const PDF_HEADER = Buffer.from("%PDF-1.4\n");

function createMockS3(overrides: Partial<DocumentS3Adapter> = {}): DocumentS3Adapter {
  const store = new Map<string, { size: number; bytes: Uint8Array }>();

  return {
    async createPresignedUploadUrl({ storageKey, sizeBytes }) {
      store.set(storageKey, { size: sizeBytes, bytes: PDF_HEADER });
      return `https://mock-s3.test/${encodeURIComponent(storageKey)}`;
    },
    async headObject(storageKey) {
      const entry = store.get(storageKey);
      if (!entry) return null;
      return { sizeBytes: entry.size, contentType: "application/pdf" };
    },
    async readObjectBytes(storageKey, maxBytes) {
      const entry = store.get(storageKey);
      if (!entry) return new Uint8Array(0);
      return entry.bytes.slice(0, maxBytes);
    },
    async deleteObject(storageKey) {
      store.delete(storageKey);
    },
    async createPresignedDownloadUrl({ storageKey }) {
      return `https://mock-s3.test/download/${encodeURIComponent(storageKey)}`;
    },
    ...overrides,
  };
}

describe("document upload lifecycle (integration)", { skip: !runIntegration }, () => {
  let userA = "";
  let userB = "";
  const originalRollout = process.env.MINDVAULT_DOCUMENT_UPLOAD_ENABLED;

  before(async () => {
    process.env.MINDVAULT_DOCUMENT_UPLOAD_ENABLED = "true";
    process.env.AWS_S3_DOCUMENT_BUCKET = "test-bucket";

    const a = await prisma.user.create({
      data: { email: `doc-a-${Date.now()}@example.com`, passwordHash: "x" },
    });
    const b = await prisma.user.create({
      data: { email: `doc-b-${Date.now()}@example.com`, passwordHash: "x" },
    });
    userA = a.id;
    userB = b.id;
    await ensureFreeSubscriptionForNewUser(userA);
    await ensureFreeSubscriptionForNewUser(userB);
  });

  after(async () => {
    if (originalRollout === undefined) {
      delete process.env.MINDVAULT_DOCUMENT_UPLOAD_ENABLED;
    } else {
      process.env.MINDVAULT_DOCUMENT_UPLOAD_ENABLED = originalRollout;
    }
    if (userA) await prisma.user.delete({ where: { id: userA } }).catch(() => {});
    if (userB) await prisma.user.delete({ where: { id: userB } }).catch(() => {});
    await prisma.$disconnect();
  });

  it("initiates and completes upload", async () => {
    const s3 = createMockS3();
    const init = await initiateDocumentUpload(
      userA,
      {
        filename: "sample.pdf",
        title: "sample",
        sizeBytes: PDF_HEADER.length,
        mimeType: "application/pdf",
      },
      s3,
    );
    assert.equal(init.ok, true);
    if (!init.ok) return;

    const complete = await completeDocumentUpload(userA, init.document.id, s3);
    assert.equal(complete.ok, true);
    if (complete.ok) {
      assert.equal(complete.document.status, DocumentStatus.QUEUED);
      assert.ok(complete.document.processingJob);
    }

    const job = await prisma.documentProcessingJob.findFirst({
      where: { documentId: init.document.id },
    });
    assert.ok(job);
  });

  it("rejects cross-user completion", async () => {
    const s3 = createMockS3();
    const init = await initiateDocumentUpload(
      userA,
      {
        filename: "owned.pdf",
        title: "owned",
        sizeBytes: PDF_HEADER.length,
        mimeType: "application/pdf",
      },
      s3,
    );
    assert.ok(init.ok);
    if (!init.ok) return;

    const complete = await completeDocumentUpload(userB, init.document.id, s3);
    assert.equal(complete.ok, false);
    assert.equal(complete.status, 404);
  });

  it("is idempotent on duplicate completion", async () => {
    const s3 = createMockS3();
    const init = await initiateDocumentUpload(
      userA,
      {
        filename: "dup.pdf",
        title: "dup",
        sizeBytes: PDF_HEADER.length,
        mimeType: "application/pdf",
      },
      s3,
    );
    assert.ok(init.ok);
    if (!init.ok) return;

    const first = await completeDocumentUpload(userA, init.document.id, s3);
    const second = await completeDocumentUpload(userA, init.document.id, s3);
    assert.ok(first.ok && second.ok);
  });

  it("rejects invalid pdf bytes", async () => {
    const s3 = createMockS3({
      async readObjectBytes() {
        return Buffer.from("NOTPDF!!");
      },
    });
    const init = await initiateDocumentUpload(
      userA,
      {
        filename: "bad.pdf",
        title: "bad",
        sizeBytes: 8,
        mimeType: "application/pdf",
      },
      s3,
    );
    assert.ok(init.ok);
    if (!init.ok) return;

    const complete = await completeDocumentUpload(userA, init.document.id, s3);
    assert.equal(complete.ok, false);
    assert.equal(complete.code, "invalid_pdf");
  });

  it("allows retry presign for pending upload", async () => {
    const s3 = createMockS3();
    const init = await initiateDocumentUpload(
      userA,
      {
        filename: "retry.pdf",
        title: "retry",
        sizeBytes: PDF_HEADER.length,
        mimeType: "application/pdf",
      },
      s3,
    );
    assert.ok(init.ok);
    if (!init.ok) return;

    const retry = await retryDocumentUpload(userA, init.document.id, s3);
    assert.equal(retry.ok, true);
  });

  it("deletes document and storage", async () => {
    const s3 = createMockS3();
    const init = await initiateDocumentUpload(
      userA,
      {
        filename: "del.pdf",
        title: "del",
        sizeBytes: PDF_HEADER.length,
        mimeType: "application/pdf",
      },
      s3,
    );
    assert.ok(init.ok);
    if (!init.ok) return;
    await completeDocumentUpload(userA, init.document.id, s3);

    const deleted = await deleteDocumentForUser(userA, init.document.id, s3);
    assert.equal(deleted.ok, true);

    const row = await prisma.document.findUnique({ where: { id: init.document.id } });
    assert.equal(row, null);
  });

  it("enforces storage quota with reservations", async () => {
    const s3 = createMockS3();
    const huge = PLAN_LIMITS.FREE.storageBytes - PDF_HEADER.length + 1;
    const init = await initiateDocumentUpload(
      userA,
      {
        filename: "huge.pdf",
        title: "huge",
        sizeBytes: huge,
        mimeType: "application/pdf",
      },
      s3,
    );
    assert.equal(init.ok, false);
    if (!init.ok) {
      assert.equal(init.code, "storage_limit");
    }
  });

  it("blocks when rollout disabled", async () => {
    const prev = process.env.MINDVAULT_DOCUMENT_UPLOAD_ENABLED;
    process.env.MINDVAULT_DOCUMENT_UPLOAD_ENABLED = "false";

    const { assertDocumentUploadAllowed } = await import("./entitlement");
    const gate = await assertDocumentUploadAllowed(userA);

    if (prev === undefined) delete process.env.MINDVAULT_DOCUMENT_UPLOAD_ENABLED;
    else process.env.MINDVAULT_DOCUMENT_UPLOAD_ENABLED = prev;
    process.env.MINDVAULT_DOCUMENT_UPLOAD_ENABLED = "true";

    assert.equal(gate.ok, false);
    if (!gate.ok) {
      assert.equal(gate.code, "feature_disabled");
    }
  });
});
