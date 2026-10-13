import type { Document, DocumentProcessingJob } from "@/generated/prisma/client";

import {
  deriveProcessingDisplayStatus,
  processingDisplayLabel,
  type ProcessingJobSummary,
} from "./processing/processing-status";
import { processingStageLabel } from "./indexing/processing-stages";

export type SerializedDocument = {
  id: string;
  title: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  status: string;
  processingVersion: number;
  uploadedAt: string | null;
  processingStartedAt: string | null;
  processingCompletedAt: string | null;
  failureReason: string | null;
  uploadExpiresAt: string;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  processingDisplayStatus: string;
  processingLabel: string;
  processingStage: string | null;
  processingTotalChunks: number | null;
  processingCompletedChunks: number | null;
  processingJob: ProcessingJobSummary | null;
};

function toJobSummary(job: DocumentProcessingJob): ProcessingJobSummary {
  return {
    jobId: job.id,
    status: job.status,
    attemptCount: job.attemptCount,
    maxAttempts: job.maxAttempts,
    availableAt: job.availableAt.toISOString(),
    lastError: job.lastError,
  };
}

export function serializeDocument(
  document: Document,
  job: DocumentProcessingJob | null = null,
): SerializedDocument {
  const processingJob = job ? toJobSummary(job) : null;
  const display = deriveProcessingDisplayStatus({
    documentStatus: document.status,
    job: processingJob,
  });

  const stageLabel = processingStageLabel(
    document.processingStage as Parameters<typeof processingStageLabel>[0],
  );

  return {
    id: document.id,
    title: document.title,
    originalFilename: document.originalFilename,
    mimeType: document.mimeType,
    sizeBytes: document.sizeBytes,
    status: document.status,
    processingVersion: document.processingVersion,
    uploadedAt: document.uploadedAt?.toISOString() ?? null,
    processingStartedAt: document.processingStartedAt?.toISOString() ?? null,
    processingCompletedAt: document.processingCompletedAt?.toISOString() ?? null,
    failureReason: document.failureReason,
    uploadExpiresAt: document.uploadExpiresAt.toISOString(),
    archivedAt: document.archivedAt?.toISOString() ?? null,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
    processingDisplayStatus: display,
    processingLabel: processingDisplayLabel(display, {
      stageLabel: document.processingStage ? stageLabel : null,
      processingStage: document.processingStage,
      totalChunks: document.processingTotalChunks,
      completedChunks: document.processingCompletedChunks,
    }),
    processingStage: document.processingStage,
    processingTotalChunks: document.processingTotalChunks,
    processingCompletedChunks: document.processingCompletedChunks,
    processingJob,
  };
}
