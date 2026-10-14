import type { Prisma } from "@/generated/prisma/client";
import {
  DocumentProcessingJobStatus,
  DocumentStatus,
} from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";

import { computeRetryDelayMs, JOB_LEASE_DURATION_MS } from "./job-config";
import { isTransientProcessingError, ProcessingError, userFacingFailureMessage } from "./job-errors";

export type ClaimedProcessingJob = {
  jobId: string;
  documentId: string;
  processingVersion: number;
  claimGeneration: number;
  attemptCount: number;
  maxAttempts: number;
  storageKey: string;
  userId: string;
  title: string;
  sizeBytes: number;
};

type ClaimRow = { id: string };

function leaseExpiresAt(from: Date): Date {
  return new Date(from.getTime() + JOB_LEASE_DURATION_MS);
}

export async function claimNextProcessingJob(
  workerId: string,
  now: Date = new Date(),
): Promise<ClaimedProcessingJob | null> {
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<ClaimRow[]>`
      SELECT j.id
      FROM document_processing_jobs j
      INNER JOIN documents d ON d.id = j.document_id
      WHERE d.status NOT IN ('DELETING', 'EXPIRED', 'PENDING_UPLOAD')
        AND j.status IN ('PENDING', 'RETRY_WAIT', 'RUNNING')
        AND (
          (j.status IN ('PENDING', 'RETRY_WAIT') AND j.available_at <= ${now})
          OR (j.status = 'RUNNING' AND j.lease_expires_at IS NOT NULL AND j.lease_expires_at <= ${now})
        )
      ORDER BY j.available_at ASC
      LIMIT 1
      FOR UPDATE OF j SKIP LOCKED
    `;

    const row = rows[0];
    if (!row) {
      return null;
    }

    const job = await tx.documentProcessingJob.findUnique({
      where: { id: row.id },
      include: {
        document: {
          select: {
            id: true,
            userId: true,
            storageKey: true,
            processingVersion: true,
            status: true,
            title: true,
            sizeBytes: true,
          },
        },
      },
    });

    if (!job?.document) {
      return null;
    }

    if (job.document.status === DocumentStatus.DELETING) {
      await tx.documentProcessingJob.update({
        where: { id: job.id },
        data: { status: DocumentProcessingJobStatus.CANCELLED, completedAt: now },
      });
      return null;
    }

    if (job.processingVersion !== job.document.processingVersion) {
      await tx.documentProcessingJob.update({
        where: { id: job.id },
        data: {
          status: DocumentProcessingJobStatus.CANCELLED,
          lastError: "Processing version mismatch.",
          completedAt: now,
        },
      });
      return null;
    }

    const nextGeneration = job.claimGeneration + 1;
    const nextAttempt = job.attemptCount + 1;
    const leaseUntil = leaseExpiresAt(now);

    const updated = await tx.documentProcessingJob.update({
      where: { id: job.id },
      data: {
        status: DocumentProcessingJobStatus.RUNNING,
        claimGeneration: nextGeneration,
        lockedBy: workerId,
        leaseExpiresAt: leaseUntil,
        heartbeatAt: now,
        attemptCount: nextAttempt,
        startedAt: job.startedAt ?? now,
        lastError: null,
      },
    });

    const documentUpdate: {
      status: DocumentStatus;
      failureReason: null;
      processingStartedAt?: Date;
    } = {
      status: DocumentStatus.PROCESSING,
      failureReason: null,
    };
    if (job.document.status === DocumentStatus.QUEUED) {
      documentUpdate.processingStartedAt = now;
    }

    await tx.document.update({
      where: { id: job.documentId },
      data: documentUpdate,
    });

    console.log("[documents:job]", {
      event: "job_claimed",
      jobId: updated.id,
      documentId: job.documentId,
      workerId,
      attemptCount: nextAttempt,
      claimGeneration: nextGeneration,
    });

    return {
      jobId: updated.id,
      documentId: job.documentId,
      processingVersion: updated.processingVersion,
      claimGeneration: nextGeneration,
      attemptCount: nextAttempt,
      maxAttempts: updated.maxAttempts,
      storageKey: job.document.storageKey,
      userId: job.document.userId,
      title: job.document.title,
      sizeBytes: job.document.sizeBytes,
    };
  });
}

export async function renewJobLease(params: {
  jobId: string;
  workerId: string;
  claimGeneration: number;
  now?: Date;
}): Promise<boolean> {
  const now = params.now ?? new Date();
  const leaseUntil = leaseExpiresAt(now);

  const result = await prisma.documentProcessingJob.updateMany({
    where: {
      id: params.jobId,
      lockedBy: params.workerId,
      claimGeneration: params.claimGeneration,
      status: DocumentProcessingJobStatus.RUNNING,
    },
    data: {
      heartbeatAt: now,
      leaseExpiresAt: leaseUntil,
    },
  });

  if (result.count === 0) {
    console.log("[documents:job]", {
      event: "heartbeat_failed",
      jobId: params.jobId,
      workerId: params.workerId,
      claimGeneration: params.claimGeneration,
    });
    return false;
  }

  return true;
}

export async function cancelProcessingJobsForDocumentTx(
  tx: Prisma.TransactionClient,
  documentId: string,
  now: Date = new Date(),
): Promise<void> {
  await tx.documentProcessingJob.updateMany({
    where: {
      documentId,
      status: {
        in: [
          DocumentProcessingJobStatus.PENDING,
          DocumentProcessingJobStatus.RUNNING,
          DocumentProcessingJobStatus.RETRY_WAIT,
        ],
      },
    },
    data: {
      status: DocumentProcessingJobStatus.CANCELLED,
      completedAt: now,
      lockedBy: null,
      leaseExpiresAt: null,
    },
  });

  console.log("[documents:job]", {
    event: "job_cancelled",
    documentId,
  });
}

export async function markJobSucceeded(params: {
  jobId: string;
  workerId: string;
  claimGeneration: number;
  now?: Date;
}): Promise<boolean> {
  const now = params.now ?? new Date();

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.documentProcessingJob.updateMany({
      where: {
        id: params.jobId,
        lockedBy: params.workerId,
        claimGeneration: params.claimGeneration,
        status: DocumentProcessingJobStatus.RUNNING,
      },
      data: {
        status: DocumentProcessingJobStatus.SUCCEEDED,
        completedAt: now,
        lockedBy: null,
        leaseExpiresAt: null,
      },
    });

    if (updated.count === 0) {
      return 0;
    }

    const job = await tx.documentProcessingJob.findUnique({
      where: { id: params.jobId },
      select: { documentId: true },
    });

    if (!job) {
      return 0;
    }

    const doc = await tx.document.findUnique({
      where: { id: job.documentId },
      select: { status: true },
    });

    if (!doc || doc.status === DocumentStatus.DELETING) {
      return updated.count;
    }

    // Legacy path: job-only success without marking READY (prefer finalizeDocumentIndexing).
    return updated.count;
  });

  if (result > 0) {
    console.log("[documents:job]", {
      event: "job_completed",
      jobId: params.jobId,
      workerId: params.workerId,
      claimGeneration: params.claimGeneration,
    });
    return true;
  }

  console.log("[documents:job]", {
    event: "job_complete_rejected",
    jobId: params.jobId,
    workerId: params.workerId,
    claimGeneration: params.claimGeneration,
  });
  return false;
}

export async function markJobFailed(params: {
  jobId: string;
  documentId: string;
  workerId: string;
  claimGeneration: number;
  error: unknown;
  now?: Date;
}): Promise<void> {
  const now = params.now ?? new Date();
  const message = userFacingFailureMessage(params.error);
  const internal =
    params.error instanceof Error ? params.error.message.slice(0, 500) : "processing_error";

  await prisma.$transaction(async (tx) => {
    const job = await tx.documentProcessingJob.findFirst({
      where: {
        id: params.jobId,
        lockedBy: params.workerId,
        claimGeneration: params.claimGeneration,
        status: DocumentProcessingJobStatus.RUNNING,
      },
    });

    if (!job) {
      return;
    }

    const doc = await tx.document.findUnique({
      where: { id: params.documentId },
      select: { status: true },
    });

    if (!doc || doc.status === DocumentStatus.DELETING) {
      await tx.documentProcessingJob.update({
        where: { id: job.id },
        data: {
          status: DocumentProcessingJobStatus.CANCELLED,
          completedAt: now,
          lockedBy: null,
          leaseExpiresAt: null,
        },
      });
      return;
    }

    const transient =
      params.error instanceof ProcessingError
        ? params.error.kind === "transient"
        : isTransientProcessingError(params.error);

    if (transient && job.attemptCount < job.maxAttempts) {
      const delayMs = computeRetryDelayMs(job.attemptCount);
      const availableAt = new Date(now.getTime() + delayMs);

      await tx.documentProcessingJob.update({
        where: { id: job.id },
        data: {
          status: DocumentProcessingJobStatus.RETRY_WAIT,
          availableAt,
          lastError: internal,
          lockedBy: null,
          leaseExpiresAt: null,
        },
      });

      await tx.document.update({
        where: { id: params.documentId },
        data: { status: DocumentStatus.QUEUED },
      });

      console.log("[documents:job]", {
        event: "job_retry_scheduled",
        jobId: job.id,
        documentId: params.documentId,
        attemptCount: job.attemptCount,
        availableAt: availableAt.toISOString(),
      });
      return;
    }

    await tx.documentProcessingJob.update({
      where: { id: job.id },
      data: {
        status: DocumentProcessingJobStatus.FAILED,
        completedAt: now,
        lastError: internal,
        lockedBy: null,
        leaseExpiresAt: null,
      },
    });

    await tx.document.update({
      where: { id: params.documentId },
      data: {
        status: DocumentStatus.FAILED,
        failureReason: message,
      },
    });

    console.log("[documents:job]", {
      event: "job_failed",
      jobId: job.id,
      documentId: params.documentId,
      attemptCount: job.attemptCount,
    });
  });
}
