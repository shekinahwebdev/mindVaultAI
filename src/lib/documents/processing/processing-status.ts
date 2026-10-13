import {
  DocumentProcessingJobStatus,
  DocumentStatus,
} from "@/generated/prisma/enums";

export type DocumentProcessingDisplayStatus =
  | "queued"
  | "processing"
  | "retrying"
  | "failed"
  | "ready"
  | "upload_pending"
  | "deleting"
  | "expired";

export type ProcessingJobSummary = {
  jobId: string;
  status: DocumentProcessingJobStatus;
  attemptCount: number;
  maxAttempts: number;
  availableAt: string | null;
  lastError: string | null;
};

export function deriveProcessingDisplayStatus(params: {
  documentStatus: DocumentStatus;
  job: ProcessingJobSummary | null;
}): DocumentProcessingDisplayStatus {
  const { documentStatus, job } = params;

  if (documentStatus === DocumentStatus.READY) {
    return "ready";
  }
  if (documentStatus === DocumentStatus.FAILED) {
    return "failed";
  }
  if (documentStatus === DocumentStatus.DELETING) {
    return "deleting";
  }
  if (documentStatus === DocumentStatus.EXPIRED) {
    return "expired";
  }
  if (documentStatus === DocumentStatus.PENDING_UPLOAD) {
    return "upload_pending";
  }

  if (job) {
    if (job.status === DocumentProcessingJobStatus.RUNNING) {
      return "processing";
    }
    if (job.status === DocumentProcessingJobStatus.RETRY_WAIT) {
      return "retrying";
    }
    if (job.status === DocumentProcessingJobStatus.FAILED) {
      return "failed";
    }
    if (job.status === DocumentProcessingJobStatus.CANCELLED) {
      return "deleting";
    }
  }

  if (documentStatus === DocumentStatus.PROCESSING) {
    return "processing";
  }

  return "queued";
}

export function processingDisplayLabel(
  status: DocumentProcessingDisplayStatus,
  progress?: {
    stageLabel?: string | null;
    processingStage?: string | null;
    totalChunks?: number | null;
    completedChunks?: number | null;
  },
): string {
  if (status === "processing" && progress?.stageLabel) {
    const total = progress.totalChunks ?? 0;
    const done = progress.completedChunks ?? 0;
    if (total > 0 && progress.processingStage === "embedding") {
      return `${progress.stageLabel} (${done}/${total})`;
    }
    return progress.stageLabel;
  }

  return processingDisplayLabelBase(status);
}

function processingDisplayLabelBase(status: DocumentProcessingDisplayStatus): string {
  switch (status) {
    case "queued":
      return "Queued";
    case "processing":
      return "Processing";
    case "retrying":
      return "Retrying";
    case "failed":
      return "Failed";
    case "ready":
      return "Ready";
    case "upload_pending":
      return "Awaiting upload";
    case "deleting":
      return "Deleting";
    case "expired":
      return "Expired";
    default:
      return status;
  }
}

export { processingDisplayLabelBase };
