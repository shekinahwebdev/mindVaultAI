import type { DocumentS3Adapter } from "@/lib/storage/s3/types";

import { ProcessingError } from "./job-errors";
import type { ClaimedProcessingJob } from "./job-repository";

export type ProcessingHandlerContext = {
  job: ClaimedProcessingJob;
  s3: DocumentS3Adapter;
  signal: AbortSignal;
  workerId: string;
};

export type ProcessingHandler = (context: ProcessingHandlerContext) => Promise<void>;

/**
 * Phase 2A placeholder: verifies the object exists in storage.
 * Does not extract text, chunk, embed, or mark the document READY.
 */
export async function runPhase2APlaceholderHandler(
  context: ProcessingHandlerContext,
): Promise<void> {
  const head = await context.s3.headObject(context.job.storageKey);
  if (!head) {
    throw new ProcessingError("Source file missing in storage.", "permanent");
  }
  if (head.sizeBytes <= 0) {
    throw new ProcessingError("Invalid stored document size.", "permanent");
  }
}

export function withOperationTimeout(
  handler: ProcessingHandler,
  timeoutMs: number,
): ProcessingHandler {
  return async (context) => {
    const controller = new AbortController();
    const linked =
      typeof AbortSignal.any === "function"
        ? AbortSignal.any([context.signal, controller.signal])
        : context.signal;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      await handler({ ...context, signal: linked });
    } catch (error) {
      if (controller.signal.aborted && !context.signal.aborted) {
        throw new ProcessingError("Processing operation timed out.", "transient");
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  };
}
