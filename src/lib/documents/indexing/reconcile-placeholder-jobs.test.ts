import "dotenv/config";

import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { DocumentProcessingJobStatus, DocumentStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { ensureFreeSubscriptionForNewUser } from "@/lib/billing/subscription-repository";
import { ensureProcessingJobForDocumentTx } from "@/lib/documents/processing/job-create";

import { reconcilePlaceholderSucceededJobs } from "./reconcile-placeholder-jobs";

const runIntegration = Boolean(process.env.DATABASE_URL);

describe("reconcilePlaceholderSucceededJobs", { skip: !runIntegration }, () => {
  let userId = "";

  before(async () => {
    const user = await prisma.user.create({
      data: { email: `reconcile-${Date.now()}@example.com`, passwordHash: "x" },
    });
    userId = user.id;
    await ensureFreeSubscriptionForNewUser(userId);
  });

  after(async () => {
    if (userId) {
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  it("requeues SUCCEEDED jobs on QUEUED documents with no chunks", async () => {
    const doc = await prisma.document.create({
      data: {
        userId,
        title: "Placeholder",
        originalFilename: "p.pdf",
        mimeType: "application/pdf",
        sizeBytes: 100,
        storageKey: `users/${userId}/documents/reconcile/p.pdf`,
        status: DocumentStatus.QUEUED,
        uploadExpiresAt: new Date(Date.now() + 3600_000),
        uploadedAt: new Date(),
      },
    });

    await prisma.$transaction(async (tx) => {
      await ensureProcessingJobForDocumentTx(tx, {
        documentId: doc.id,
        processingVersion: doc.processingVersion,
      });
    });

    await prisma.documentProcessingJob.updateMany({
      where: { documentId: doc.id },
      data: {
        status: DocumentProcessingJobStatus.SUCCEEDED,
        completedAt: new Date(),
      },
    });

    const first = await reconcilePlaceholderSucceededJobs();
    assert.ok(first.requeued >= 1);

    const job = await prisma.documentProcessingJob.findFirst({ where: { documentId: doc.id } });
    assert.equal(job?.status, DocumentProcessingJobStatus.PENDING);

    const second = await reconcilePlaceholderSucceededJobs();
    assert.equal(second.requeued, 0);
  });

  it("skips documents that already have chunks", async () => {
    const doc = await prisma.document.create({
      data: {
        userId,
        title: "Indexed",
        originalFilename: "i.pdf",
        mimeType: "application/pdf",
        sizeBytes: 100,
        storageKey: `users/${userId}/documents/reconcile/i.pdf`,
        status: DocumentStatus.QUEUED,
        uploadExpiresAt: new Date(Date.now() + 3600_000),
        uploadedAt: new Date(),
      },
    });

    await prisma.$transaction(async (tx) => {
      await ensureProcessingJobForDocumentTx(tx, {
        documentId: doc.id,
        processingVersion: doc.processingVersion,
      });
    });

    await prisma.documentProcessingJob.updateMany({
      where: { documentId: doc.id },
      data: { status: DocumentProcessingJobStatus.SUCCEEDED, completedAt: new Date() },
    });

    await prisma.$executeRaw`
      INSERT INTO document_chunks (
        id, document_id, processing_version, chunk_index,
        content, page_start, page_end, character_count,
        created_at, updated_at
      )
      VALUES (
        ${crypto.randomUUID()}, ${doc.id}, ${doc.processingVersion}, 0,
        'chunk', 1, 1, 5,
        now(), now()
      )
    `;

    const result = await reconcilePlaceholderSucceededJobs();
    assert.ok(result.skippedIndexed >= 1);

    const job = await prisma.documentProcessingJob.findFirst({ where: { documentId: doc.id } });
    assert.equal(job?.status, DocumentProcessingJobStatus.SUCCEEDED);
  });
});
