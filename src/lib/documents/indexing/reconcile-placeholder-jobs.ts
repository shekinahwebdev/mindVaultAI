import { DocumentProcessingJobStatus, DocumentStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";

export type ReconcilePlaceholderResult = {
  scanned: number;
  requeued: number;
  skippedReady: number;
  skippedIndexed: number;
};

/**
 * Phase 2A placeholder jobs marked SUCCEEDED while documents stayed QUEUED
 * without creating chunks. This idempotently resets those jobs to PENDING so
 * the real indexer can run.
 *
 * Safe to run multiple times:
 * - READY documents are never touched.
 * - Documents with any chunk rows for the current processing version are skipped.
 * - Does not delete storage or change document identity.
 */
export async function reconcilePlaceholderSucceededJobs(
  now: Date = new Date(),
): Promise<ReconcilePlaceholderResult> {
  const candidates = await prisma.documentProcessingJob.findMany({
    where: {
      status: DocumentProcessingJobStatus.SUCCEEDED,
      document: {
        status: DocumentStatus.QUEUED,
      },
    },
    select: {
      id: true,
      documentId: true,
      processingVersion: true,
      document: { select: { status: true, processingVersion: true } },
    },
  });

  let requeued = 0;
  let skippedReady = 0;
  let skippedIndexed = 0;

  for (const job of candidates) {
    if (job.document.status === DocumentStatus.READY) {
      skippedReady += 1;
      continue;
    }
    if (job.processingVersion !== job.document.processingVersion) {
      continue;
    }

    const chunkRows = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count
      FROM document_chunks
      WHERE document_id = ${job.documentId}
        AND processing_version = ${job.processingVersion}
    `;
    const chunkCount = Number(chunkRows[0]?.count ?? 0);
    if (chunkCount > 0) {
      skippedIndexed += 1;
      continue;
    }

    const updated = await prisma.documentProcessingJob.updateMany({
      where: {
        id: job.id,
        status: DocumentProcessingJobStatus.SUCCEEDED,
      },
      data: {
        status: DocumentProcessingJobStatus.PENDING,
        completedAt: null,
        lockedBy: null,
        leaseExpiresAt: null,
        lastError: null,
        availableAt: now,
      },
    });

    if (updated.count > 0) {
      requeued += 1;
      console.log("[documents:reconcile]", {
        event: "placeholder_job_requeued",
        jobId: job.id,
        documentId: job.documentId,
      });
    }
  }

  return {
    scanned: candidates.length,
    requeued,
    skippedReady,
    skippedIndexed,
  };
}
