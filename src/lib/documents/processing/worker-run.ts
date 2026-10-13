import { createDocumentS3Adapter } from "@/lib/storage/s3/client";
import type { DocumentS3Adapter } from "@/lib/storage/s3/types";

import {
  JOB_HEARTBEAT_INTERVAL_MS,
  JOB_OPERATION_TIMEOUT_MS,
  WORKER_POLL_INTERVAL_MS,
} from "./job-config";
import {
  claimNextProcessingJob,
  markJobFailed,
  markJobSucceeded,
  renewJobLease,
  type ClaimedProcessingJob,
} from "./job-repository";
import { runDocumentIndexingHandler } from "@/lib/documents/indexing/index-document-handler";

import { withOperationTimeout, type ProcessingHandler } from "./processing-handler";

export type DocumentWorkerOptions = {
  workerId: string;
  handler?: ProcessingHandler;
  s3?: DocumentS3Adapter;
  pollIntervalMs?: number;
  shouldContinue?: () => boolean;
  sleep?: (ms: number) => Promise<void>;
};

export function createWorkerId(hostname?: string): string {
  const host = hostname ?? process.env.HOSTNAME ?? "local";
  return `${host}-${process.pid}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function runDocumentWorkerLoop(options: DocumentWorkerOptions): Promise<void> {
  const handler = withOperationTimeout(
    options.handler ?? runDocumentIndexingHandler,
    JOB_OPERATION_TIMEOUT_MS,
  );
  const s3 = options.s3 ?? createDocumentS3Adapter();
  const pollIntervalMs = options.pollIntervalMs ?? WORKER_POLL_INTERVAL_MS;
  const shouldContinue = options.shouldContinue ?? (() => true);
  const sleep = options.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));

  while (shouldContinue()) {
    const claimed = await claimNextProcessingJob(options.workerId);
    if (!claimed) {
      await sleep(pollIntervalMs);
      continue;
    }

    await executeClaimedJob({
      claimed,
      workerId: options.workerId,
      handler,
      s3,
      shouldContinue,
    });
  }
}

export async function executeClaimedJob(params: {
  claimed: ClaimedProcessingJob;
  workerId: string;
  handler: ProcessingHandler;
  s3: DocumentS3Adapter;
  shouldContinue: () => boolean;
  /** When true, call markJobSucceeded after handler (Phase 2A placeholder only). */
  legacyJobOnlyFinalize?: boolean;
}): Promise<void> {
  const abort = new AbortController();
  const heartbeat = setInterval(() => {
    void renewJobLease({
      jobId: params.claimed.jobId,
      workerId: params.workerId,
      claimGeneration: params.claimed.claimGeneration,
    }).then((ok) => {
      if (!ok) {
        abort.abort();
      }
    });
  }, JOB_HEARTBEAT_INTERVAL_MS);

  console.log("[documents:job]", {
    event: "processing_started",
    jobId: params.claimed.jobId,
    documentId: params.claimed.documentId,
    workerId: params.workerId,
    attemptCount: params.claimed.attemptCount,
  });

  try {
    await params.handler({
      job: params.claimed,
      s3: params.s3,
      signal: abort.signal,
      workerId: params.workerId,
    });

    if (abort.signal.aborted) {
      console.log("[documents:job]", {
        event: "processing_lost_lease",
        jobId: params.claimed.jobId,
        workerId: params.workerId,
      });
      return;
    }

    if (params.legacyJobOnlyFinalize) {
      const ok = await markJobSucceeded({
        jobId: params.claimed.jobId,
        workerId: params.workerId,
        claimGeneration: params.claimed.claimGeneration,
      });
      if (!ok) {
        console.log("[documents:job]", {
          event: "processing_finalize_rejected",
          jobId: params.claimed.jobId,
          workerId: params.workerId,
        });
      }
    }
  } catch (error) {
    if (abort.signal.aborted) {
      return;
    }
    await markJobFailed({
      jobId: params.claimed.jobId,
      documentId: params.claimed.documentId,
      workerId: params.workerId,
      claimGeneration: params.claimed.claimGeneration,
      error,
    });
  } finally {
    clearInterval(heartbeat);
  }
}

export type DocumentWorkerOptionsWithLegacy = DocumentWorkerOptions & {
  legacyJobOnlyFinalize?: boolean;
};

export async function runSingleWorkerIteration(
  workerId: string,
  overrides: Partial<DocumentWorkerOptionsWithLegacy> = {},
): Promise<boolean> {
  const claimed = await claimNextProcessingJob(workerId);
  if (!claimed) {
    return false;
  }

  const handler = withOperationTimeout(
    overrides.handler ?? runDocumentIndexingHandler,
    JOB_OPERATION_TIMEOUT_MS,
  );
  const s3 = overrides.s3 ?? createDocumentS3Adapter();

  await executeClaimedJob({
    claimed,
    workerId,
    handler,
    s3,
    shouldContinue: () => true,
    legacyJobOnlyFinalize: overrides.legacyJobOnlyFinalize,
  });

  return true;
}
