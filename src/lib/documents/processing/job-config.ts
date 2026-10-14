/** How long a worker may hold a claimed job before lease recovery (ms). */
export const JOB_LEASE_DURATION_MS = Number(
  process.env.MINDVAULT_JOB_LEASE_MS ?? 60_000,
);

/** Heartbeat interval while processing (ms). Should be < JOB_LEASE_DURATION_MS / 2. */
export const JOB_HEARTBEAT_INTERVAL_MS = Number(
  process.env.MINDVAULT_JOB_HEARTBEAT_MS ?? 20_000,
);

/** Max time a single handler invocation may run (ms). */
export const JOB_OPERATION_TIMEOUT_MS = Number(
  process.env.MINDVAULT_JOB_OPERATION_TIMEOUT_MS ?? 120_000,
);

/** Overall deadline from first claim (ms) — optional cap across retries. */
export const JOB_PROCESSING_DEADLINE_MS = Number(
  process.env.MINDVAULT_JOB_PROCESSING_DEADLINE_MS ?? 30 * 60_000,
);

export const JOB_DEFAULT_MAX_ATTEMPTS = Number(
  process.env.MINDVAULT_JOB_MAX_ATTEMPTS ?? 5,
);

export const JOB_INITIAL_RETRY_DELAY_MS = Number(
  process.env.MINDVAULT_JOB_RETRY_INITIAL_MS ?? 5_000,
);

export const JOB_MAX_RETRY_DELAY_MS = Number(
  process.env.MINDVAULT_JOB_RETRY_MAX_MS ?? 5 * 60_000,
);

export const JOB_RETRY_JITTER_RATIO = 0.2;

export const WORKER_POLL_INTERVAL_MS = Number(
  process.env.MINDVAULT_WORKER_POLL_MS ?? 2_000,
);

export function computeRetryDelayMs(attemptCount: number): number {
  const base = JOB_INITIAL_RETRY_DELAY_MS * 2 ** Math.max(0, attemptCount - 1);
  const capped = Math.min(base, JOB_MAX_RETRY_DELAY_MS);
  const jitter = capped * JOB_RETRY_JITTER_RATIO * (Math.random() * 2 - 1);
  return Math.max(1_000, Math.floor(capped + jitter));
}
