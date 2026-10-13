# Document processing — Phase 2A (background jobs)

Phase 2A adds **durable PostgreSQL-backed jobs** and a **standalone Node worker**. It does **not** extract PDF text, chunk, embed, or update RAG.

## Architecture

```text
Upload complete (API) ──transaction──► Document QUEUED + DocumentProcessingJob PENDING
                                              │
                                              ▼
                         document-processing-worker (poll + claim)
                                              │
                                              ▼
                         Placeholder handler (S3 head check only)
                                              │
                                              ▼
                         Job SUCCEEDED · Document stays QUEUED (not READY)
```

- **Next.js** creates jobs and serves status APIs.
- **Worker** (`npm run documents:worker`) claims jobs with `FOR UPDATE SKIP LOCKED`.
- **Fencing:** `claimGeneration` must match on heartbeat and finalize.

## Job model

Table `document_processing_jobs` — one row per `(documentId, processingVersion)`.

Statuses: `PENDING`, `RUNNING`, `RETRY_WAIT`, `SUCCEEDED`, `FAILED`, `CANCELLED`.

## State transitions

| Event | Job | Document |
|-------|-----|----------|
| Upload complete | `PENDING` created | `QUEUED` |
| Claimed | `RUNNING` (+ lease) | `PROCESSING` |
| Placeholder success | `SUCCEEDED` | **`QUEUED`** (honest until Phase 2B indexing) |
| Transient error | `RETRY_WAIT` | `QUEUED` |
| Exhausted retries | `FAILED` | `FAILED` |
| User delete | `CANCELLED` | `DELETING` → removed |

## Leases and heartbeats

- Default lease: **60s** (`MINDVAULT_JOB_LEASE_MS`)
- Heartbeat every **20s** (`MINDVAULT_JOB_HEARTBEAT_MS`)
- Expired `RUNNING` jobs are reclaimable by another worker (`claimGeneration` increments).

## Retry policy

- Default **5** attempts (`MINDVAULT_JOB_MAX_ATTEMPTS`)
- Exponential backoff from **5s** to **5m** with jitter
- `ProcessingError` with `kind: "permanent"` does not retry

## Recovery

| Scenario | Behavior |
|----------|----------|
| Worker crash | Lease expires → another worker reclaims |
| Stale finalize | Rejected if `claimGeneration` / `lockedBy` mismatch |
| DB unavailable | Worker logs error, polls again |
| Delete during run | Jobs cancelled; finalize no-ops |

## Commands

```bash
npm run documents:worker          # long-running poller
npm run documents:jobs:backfill   # jobs for pre-2A QUEUED documents
npx prisma migrate deploy         # apply job migration
```

## Environment variables

See `src/lib/documents/processing/job-config.ts` for:

- `MINDVAULT_JOB_LEASE_MS`
- `MINDVAULT_JOB_HEARTBEAT_MS`
- `MINDVAULT_JOB_OPERATION_TIMEOUT_MS`
- `MINDVAULT_JOB_MAX_ATTEMPTS`
- `MINDVAULT_JOB_RETRY_INITIAL_MS` / `MINDVAULT_JOB_RETRY_MAX_MS`
- `MINDVAULT_WORKER_POLL_MS`

Also requires `DATABASE_URL` and Phase 1 S3 settings for the placeholder handler.

## Deployment (Vercel + AWS)

- **Do not** run the worker inside Vercel serverless routes.
- Run the worker on **ECS/Fargate**, **Railway**, **Fly.io**, or a small **EC2** instance with IAM access to S3 and Postgres (same `DATABASE_URL` as the app).
- Schedule Phase 1 cleanup separately; worker only processes jobs.

## Phase 2B integration

Replace `runPhase2APlaceholderHandler` in `worker-run.ts` / worker script with a real handler that:

1. Extracts text and chunks
2. Writes `DocumentChunk` rows and embeddings
3. Sets document `READY` only when indexing succeeds
4. Uses the same claim/fence/retry primitives in `job-repository.ts`
