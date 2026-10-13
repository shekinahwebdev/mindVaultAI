import {
  DocumentProcessingJobStatus,
  DocumentStatus,
} from "@/generated/prisma/enums";
import { EMBEDDING_DIMENSIONS } from "@/lib/ai/embed-text";
import { prisma } from "@/lib/db";

import {
  countChunksForVersion,
  countEmbeddedChunksForVersion,
} from "./chunk-repository";
import { getPipelineSpec } from "./processing-version";

export async function finalizeDocumentIndexing(params: {
  jobId: string;
  documentId: string;
  processingVersion: number;
  workerId: string;
  claimGeneration: number;
  expectedChunkCount: number;
  now?: Date;
}): Promise<boolean> {
  const now = params.now ?? new Date();
  const spec = getPipelineSpec(params.processingVersion);

  if (params.expectedChunkCount <= 0) {
    return false;
  }

  const total = await countChunksForVersion(params.documentId, params.processingVersion);
  const embedded = await countEmbeddedChunksForVersion(
    params.documentId,
    params.processingVersion,
  );

  if (total !== params.expectedChunkCount || embedded !== params.expectedChunkCount) {
    return false;
  }

  const dimCheck = await prisma.$queryRaw<Array<{ bad: bigint }>>`
    SELECT COUNT(*)::bigint AS bad
    FROM document_chunks
    WHERE document_id = ${params.documentId}
      AND processing_version = ${params.processingVersion}
      AND (
        embedding IS NULL
        OR embedding_dimensions IS DISTINCT FROM ${EMBEDDING_DIMENSIONS}
        OR embedding_model IS DISTINCT FROM ${spec.embeddingModel}
      )
  `;
  if (Number(dimCheck[0]?.bad ?? 0) > 0) {
    return false;
  }

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
      return false;
    }

    const doc = await tx.document.findUnique({
      where: { id: params.documentId },
      select: { status: true, processingVersion: true },
    });

    if (
      !doc ||
      doc.status === DocumentStatus.DELETING ||
      doc.processingVersion !== params.processingVersion
    ) {
      return true;
    }

    await tx.document.update({
      where: { id: params.documentId },
      data: {
        status: DocumentStatus.READY,
        processingCompletedAt: now,
        processingStage: null,
        processingTotalChunks: params.expectedChunkCount,
        processingCompletedChunks: params.expectedChunkCount,
        failureReason: null,
      },
    });

    return true;
  });

  if (result) {
    console.log("[documents:job]", {
      event: "indexing_finalized",
      jobId: params.jobId,
      documentId: params.documentId,
      chunkCount: params.expectedChunkCount,
      workerId: params.workerId,
      claimGeneration: params.claimGeneration,
    });
  }

  return result;
}
