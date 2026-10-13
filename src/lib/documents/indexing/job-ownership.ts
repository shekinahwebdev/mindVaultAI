import { DocumentProcessingJobStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";

export async function verifyJobOwnership(params: {
  jobId: string;
  workerId: string;
  claimGeneration: number;
}): Promise<boolean> {
  const job = await prisma.documentProcessingJob.findFirst({
    where: {
      id: params.jobId,
      lockedBy: params.workerId,
      claimGeneration: params.claimGeneration,
      status: DocumentProcessingJobStatus.RUNNING,
    },
    select: { id: true },
  });
  return Boolean(job);
}
