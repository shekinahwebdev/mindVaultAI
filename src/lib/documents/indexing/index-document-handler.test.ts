import "dotenv/config";

import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { DocumentProcessingJobStatus, DocumentStatus } from "@/generated/prisma/enums";
import { EMBEDDING_DIMENSIONS } from "@/lib/ai/embed-text";
import { prisma } from "@/lib/db";
import { ensureFreeSubscriptionForNewUser } from "@/lib/billing/subscription-repository";
import type { DocumentS3Adapter } from "@/lib/storage/s3/types";
import { ensureProcessingJobForDocumentTx } from "@/lib/documents/processing/job-create";
import { claimNextProcessingJob } from "@/lib/documents/processing/job-repository";
import { ProcessingError } from "@/lib/documents/processing/job-errors";

import { createDocumentIndexingHandler } from "./index-document-handler";
import { countEmbeddedChunksForVersion } from "./chunk-repository";
import { buildMinimalTextPdf } from "./test-fixtures/pdf-bytes";

const runIntegration = Boolean(process.env.DATABASE_URL);

function mockEmbed() {
  return async () => ({
    ok: true as const,
    embedding: new Array(EMBEDDING_DIMENSIONS).fill(0.01),
    meta: { model: "gemini-embedding-001", dimensions: EMBEDDING_DIMENSIONS, latencyMs: 1 },
  });
}

describe("document indexing handler (integration)", { skip: !runIntegration }, () => {
  let userId = "";
  let documentId = "";
  let pdfBytes: Buffer;

  before(async () => {
    pdfBytes = buildMinimalTextPdf("Index me now.");
    const user = await prisma.user.create({
      data: { email: `index-${Date.now()}@example.com`, passwordHash: "x" },
    });
    userId = user.id;
    await ensureFreeSubscriptionForNewUser(userId);

    const doc = await prisma.document.create({
      data: {
        userId,
        title: "Index Doc",
        originalFilename: "index.pdf",
        mimeType: "application/pdf",
        sizeBytes: pdfBytes.length,
        storageKey: `users/${userId}/documents/index/index.pdf`,
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

  function s3(): DocumentS3Adapter {
    return {
      async createPresignedUploadUrl() {
        return "https://mock/upload";
      },
      async headObject() {
        return { sizeBytes: pdfBytes.length, contentType: "application/pdf" };
      },
      async readObjectBytes() {
        return pdfBytes;
      },
      async deleteObject() {},
      async createPresignedDownloadUrl() {
        return "https://mock/download";
      },
    };
  }

  it("marks document READY after extract, chunk, embed, finalize", async () => {
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
        completedAt: null,
      },
    });

    const claimed = await claimNextProcessingJob("worker-index");
    assert.ok(claimed);

    const handler = createDocumentIndexingHandler({ embed: mockEmbed(), embedConcurrency: 2 });
    await handler({
      job: claimed,
      s3: s3(),
      signal: new AbortController().signal,
      workerId: "worker-index",
    });

    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    assert.equal(doc?.status, DocumentStatus.READY);
    assert.ok((doc?.processingCompletedChunks ?? 0) > 0);

    const job = await prisma.documentProcessingJob.findFirst({ where: { documentId } });
    assert.equal(job?.status, DocumentProcessingJobStatus.SUCCEEDED);
  });

  it("resumes embedding for partially indexed chunks", async () => {
    const job = await prisma.documentProcessingJob.findFirst({ where: { documentId } });
    assert.ok(job);

    await prisma.$executeRaw`
      UPDATE document_chunks
      SET embedding = NULL, embedding_model = NULL, embedding_dimensions = NULL
      WHERE document_id = ${documentId}
        AND processing_version = ${job.processingVersion}
        AND chunk_index = 0
    `;

    await prisma.document.update({
      where: { id: documentId },
      data: { status: DocumentStatus.PROCESSING },
    });
    await prisma.documentProcessingJob.update({
      where: { id: job.id },
      data: {
        status: DocumentProcessingJobStatus.RUNNING,
        lockedBy: "worker-resume",
        claimGeneration: 10,
        leaseExpiresAt: new Date(Date.now() + 60_000),
        completedAt: null,
      },
    });

    let calls = 0;
    const handler = createDocumentIndexingHandler({
      embed: async () => {
        calls += 1;
        return {
          ok: true as const,
          embedding: new Array(EMBEDDING_DIMENSIONS).fill(0.02),
          meta: {
            model: "gemini-embedding-001",
            dimensions: EMBEDDING_DIMENSIONS,
            latencyMs: 1,
          },
        };
      },
    });

    await handler({
      job: {
        jobId: job.id,
        documentId,
        processingVersion: job.processingVersion,
        claimGeneration: 10,
        attemptCount: 1,
        maxAttempts: 5,
        storageKey: `users/${userId}/documents/index/index.pdf`,
        userId,
        title: "Index Doc",
        sizeBytes: pdfBytes.length,
      },
      s3: s3(),
      signal: new AbortController().signal,
      workerId: "worker-resume",
    });

    const embedded = await countEmbeddedChunksForVersion(documentId, job.processingVersion);
    assert.equal(embedded, 1);
    assert.equal(calls, 1);
  });

  it("stops when lease generation does not match", async () => {
    const job = await prisma.documentProcessingJob.findFirst({ where: { documentId } });
    assert.ok(job);

    const handler = createDocumentIndexingHandler({ embed: mockEmbed() });
    await assert.rejects(
      () =>
        handler({
          job: {
            jobId: job.id,
            documentId,
            processingVersion: job.processingVersion,
            claimGeneration: job.claimGeneration + 99,
            attemptCount: 1,
            maxAttempts: 5,
            storageKey: `users/${userId}/documents/index/index.pdf`,
            userId,
            title: "Index Doc",
            sizeBytes: pdfBytes.length,
          },
          s3: s3(),
          signal: new AbortController().signal,
          workerId: job.lockedBy ?? "wrong",
        }),
      ProcessingError,
    );
  });
});
