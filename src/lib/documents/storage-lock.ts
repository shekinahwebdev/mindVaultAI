import { createHash } from "node:crypto";

import type { Prisma } from "@/generated/prisma/client";

/** Serialize per-user storage quota mutations within a transaction. */
export async function acquireUserStorageQuotaLock(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<void> {
  const hash = createHash("sha256").update(`mv-storage:${userId}`).digest();
  const lockKey = hash.readBigInt64BE(0);
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(${lockKey})`;
}
