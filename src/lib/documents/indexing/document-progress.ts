import { DocumentStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";

import type { ProcessingStage } from "./processing-stages";
import { verifyJobOwnership } from "./job-ownership";

export async function updateDocumentProcessingProgress(params: {
  documentId: string;
  jobId: string;
  workerId: string;
  claimGeneration: number;
  stage: ProcessingStage;
  totalChunks?: number | null;
  completedChunks?: number | null;
}): Promise<boolean> {
  const owns = await verifyJobOwnership({
    jobId: params.jobId,
    workerId: params.workerId,
    claimGeneration: params.claimGeneration,
  });
  if (!owns) {
    return false;
  }

  const doc = await prisma.document.findUnique({
    where: { id: params.documentId },
    select: { status: true },
  });
  if (!doc || doc.status === DocumentStatus.DELETING) {
    return false;
  }

  await prisma.document.update({
    where: { id: params.documentId },
    data: {
      processingStage: params.stage,
      ...(params.totalChunks !== undefined ? { processingTotalChunks: params.totalChunks } : {}),
      ...(params.completedChunks !== undefined
        ? { processingCompletedChunks: params.completedChunks }
        : {}),
    },
  });

  return true;
}
