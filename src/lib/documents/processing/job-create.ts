import type { Prisma } from "@/generated/prisma/client";
import { DocumentProcessingJobStatus } from "@/generated/prisma/enums";

import { JOB_DEFAULT_MAX_ATTEMPTS } from "./job-config";

/**
 * Ensures exactly one job row exists per document + processingVersion.
 * Safe to call from upload-complete transaction (idempotent).
 */
export async function ensureProcessingJobForDocumentTx(
  tx: Prisma.TransactionClient,
  params: { documentId: string; processingVersion: number; maxAttempts?: number },
): Promise<void> {
  const maxAttempts = params.maxAttempts ?? JOB_DEFAULT_MAX_ATTEMPTS;

  await tx.documentProcessingJob.upsert({
    where: {
      documentId_processingVersion: {
        documentId: params.documentId,
        processingVersion: params.processingVersion,
      },
    },
    create: {
      documentId: params.documentId,
      processingVersion: params.processingVersion,
      status: DocumentProcessingJobStatus.PENDING,
      attemptCount: 0,
      maxAttempts,
      availableAt: new Date(),
    },
    update: {},
  });
}

/** Backfill jobs for documents already QUEUED before Phase 2A. */
export async function backfillMissingProcessingJobs(limit = 200): Promise<number> {
  const { prisma } = await import("@/lib/db");
  const { DocumentStatus } = await import("@/generated/prisma/enums");

  const documents = await prisma.document.findMany({
    where: {
      status: { in: [DocumentStatus.QUEUED, DocumentStatus.PROCESSING] },
    },
    select: { id: true, processingVersion: true },
    take: limit,
  });

  let created = 0;
  for (const doc of documents) {
    const existing = await prisma.documentProcessingJob.findUnique({
      where: {
        documentId_processingVersion: {
          documentId: doc.id,
          processingVersion: doc.processingVersion,
        },
      },
    });
    if (existing) continue;

    await prisma.documentProcessingJob.create({
      data: {
        documentId: doc.id,
        processingVersion: doc.processingVersion,
        maxAttempts: JOB_DEFAULT_MAX_ATTEMPTS,
      },
    });
    created += 1;
  }

  return created;
}
