import "dotenv/config";

import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { DocumentProcessingJobStatus, DocumentStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { ensureFreeSubscriptionForNewUser } from "@/lib/billing/subscription-repository";
import type { DocumentS3Adapter } from "@/lib/storage/s3/types";

import { ensureProcessingJobForDocumentTx } from "./job-create";
import {
  claimNextProcessingJob,
  markJobSucceeded,
  renewJobLease,
} from "./job-repository";
import { runSingleWorkerIteration } from "./worker-run";
import { ProcessingError } from "./job-errors";
import { runPhase2APlaceholderHandler } from "./processing-handler";

const runIntegration = Boolean(process.env.DATABASE_URL);
const PDF_HEADER = Buffer.from("%PDF-1.4\n");

function mockS3(): DocumentS3Adapter {
  return {
    async createPresignedUploadUrl() {
      return "https://mock/upload";
    },
    async headObject() {
      return { sizeBytes: PDF_HEADER.length, contentType: "application/pdf" };
    },
    async readObjectBytes() {
      return PDF_HEADER;
    },
    async deleteObject() {},
    async createPresignedDownloadUrl() {
      return "https://mock/download";
    },
  };
}

describe("document processing jobs (integration)", { skip: !runIntegration }, () => {
  let userId = "";
  let documentId = "";

  before(async () => {
    process.env.MINDVAULT_DOCUMENT_UPLOAD_ENABLED = "true";
    const user = await prisma.user.create({
      data: { email: `job-${Date.now()}@example.com`, passwordHash: "x" },
    });
    userId = user.id;
    await ensureFreeSubscriptionForNewUser(userId);

    const doc = await prisma.document.create({
      data: {
        userId,
        title: "Job test",
        originalFilename: "job.pdf",
        mimeType: "application/pdf",
        sizeBytes: PDF_HEADER.length,
        storageKey: `users/${userId}/documents/test/job.pdf`,
        status: DocumentStatus.QUEUED,
        uploadExpiresAt: new Date(Date.now() + 3600_000),
        uploadedAt: new Date(),
      },
    });
    documentId = doc.id;

    await prisma.$transaction(async (tx) => {
      await ensureProcessingJobForDocumentTx(tx, {
        documentId,
        processingVersion: doc.processingVersion,
      });
    });
  });

  after(async () => {
    if (userId) {
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  it("claims atomically under concurrency", async () => {
    await prisma.documentProcessingJob.updateMany({
      where: {
        documentId: { not: documentId },
        status: { in: [DocumentProcessingJobStatus.PENDING, DocumentProcessingJobStatus.RETRY_WAIT] },
      },
      data: { status: DocumentProcessingJobStatus.CANCELLED, completedAt: new Date() },
    });

    await prisma.documentProcessingJob.updateMany({
      where: { documentId },
      data: {
        status: DocumentProcessingJobStatus.PENDING,
        lockedBy: null,
        leaseExpiresAt: null,
        claimGeneration: 0,
        attemptCount: 0,
        availableAt: new Date(),
      },
    });

    const [a, b] = await Promise.all([
      claimNextProcessingJob("worker-a"),
      claimNextProcessingJob("worker-b"),
    ]);
    const claimed = [a, b].filter(Boolean);
    assert.equal(claimed.length, 1);

    await prisma.documentProcessingJob.updateMany({
      where: { documentId },
      data: {
        status: DocumentProcessingJobStatus.PENDING,
        lockedBy: null,
        leaseExpiresAt: null,
      },
    });
  });

  it("rejects stale worker finalize via claimGeneration fencing", async () => {
    await prisma.documentProcessingJob.updateMany({
      where: { documentId },
      data: {
        status: DocumentProcessingJobStatus.RUNNING,
        lockedBy: "stale-worker",
        claimGeneration: 3,
        attemptCount: 1,
        leaseExpiresAt: new Date(Date.now() + 60_000),
      },
    });

    const ok = await markJobSucceeded({
      jobId: (await prisma.documentProcessingJob.findFirst({ where: { documentId } }))!.id,
      workerId: "stale-worker",
      claimGeneration: 2,
    });
    assert.equal(ok, false);
  });

  it("renews lease only for matching worker and generation", async () => {
    const job = await prisma.documentProcessingJob.findFirst({ where: { documentId } });
    assert.ok(job);

    const renewed = await renewJobLease({
      jobId: job.id,
      workerId: job.lockedBy ?? "worker-a",
      claimGeneration: job.claimGeneration,
    });
    assert.equal(renewed, true);
  });

  it("placeholder worker completes without marking document READY (legacy finalize)", async () => {
    await prisma.documentProcessingJob.updateMany({
      where: {
        documentId: { not: documentId },
        status: { in: [DocumentProcessingJobStatus.PENDING, DocumentProcessingJobStatus.RETRY_WAIT] },
      },
      data: { status: DocumentProcessingJobStatus.CANCELLED, completedAt: new Date() },
    });

    await prisma.document.update({
      where: { id: documentId },
      data: { status: DocumentStatus.QUEUED },
    });
    await prisma.documentProcessingJob.updateMany({
      where: { documentId },
      data: {
        status: DocumentProcessingJobStatus.PENDING,
        lockedBy: null,
        leaseExpiresAt: null,
        claimGeneration: 0,
        attemptCount: 0,
        availableAt: new Date(),
      },
    });

    let ran = false;
    for (let i = 0; i < 5; i += 1) {
      ran = await runSingleWorkerIteration("worker-placeholder", {
        s3: mockS3(),
        handler: runPhase2APlaceholderHandler,
        legacyJobOnlyFinalize: true,
      });
      if (ran) break;
    }
    assert.equal(ran, true);

    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    assert.equal(doc?.status, DocumentStatus.PROCESSING);

    const job = await prisma.documentProcessingJob.findUnique({
      where: {
        documentId_processingVersion: {
          documentId,
          processingVersion: doc!.processingVersion,
        },
      },
    });
    assert.equal(job?.status, DocumentProcessingJobStatus.SUCCEEDED);
  });

  it("schedules retry on transient failure", async () => {
    await prisma.documentProcessingJob.updateMany({
      where: {
        documentId: { not: documentId },
        status: { in: [DocumentProcessingJobStatus.PENDING, DocumentProcessingJobStatus.RETRY_WAIT] },
      },
      data: { status: DocumentProcessingJobStatus.CANCELLED, completedAt: new Date() },
    });

    await prisma.documentProcessingJob.updateMany({
      where: { documentId },
      data: {
        status: DocumentProcessingJobStatus.PENDING,
        attemptCount: 0,
        availableAt: new Date(),
        claimGeneration: 0,
        lockedBy: null,
        leaseExpiresAt: null,
      },
    });

    await runSingleWorkerIteration("worker-fail", {
      s3: mockS3(),
      handler: async () => {
        throw new ProcessingError("temporary", "transient");
      },
    });

    const job = await prisma.documentProcessingJob.findFirst({ where: { documentId } });
    assert.equal(job?.status, DocumentProcessingJobStatus.RETRY_WAIT);
  });
});
