import type { Prisma } from "@/generated/prisma/client";
import { AvatarType, DocumentStatus, SubscriptionPlan } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { PLAN_LIMITS } from "@/lib/billing/plans";
import {
  getOrCreateUserSubscription,
  resolveEffectivePlan,
} from "@/lib/billing/subscription-repository";
import { estimateDataUrlBytes } from "@/lib/billing/storage";

import { acquireUserStorageQuotaLock } from "./storage-lock";

const COMMITTED_STATUSES: DocumentStatus[] = [
  DocumentStatus.QUEUED,
  DocumentStatus.PROCESSING,
  DocumentStatus.READY,
  DocumentStatus.FAILED,
  DocumentStatus.DELETING,
];

export async function getAvatarUsageBytes(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatarType: true, avatarImageUrl: true },
  });

  if (
    user?.avatarType === AvatarType.IMAGE &&
    user.avatarImageUrl?.startsWith("data:")
  ) {
    return estimateDataUrlBytes(user.avatarImageUrl);
  }

  return 0;
}

export async function sumCommittedDocumentBytesTx(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<number> {
  const aggregate = await tx.document.aggregate({
    where: {
      userId,
      status: { in: COMMITTED_STATUSES },
    },
    _sum: { sizeBytes: true },
  });
  return aggregate._sum.sizeBytes ?? 0;
}

export async function sumActiveReservationBytesTx(
  tx: Prisma.TransactionClient,
  userId: string,
  now: Date,
): Promise<number> {
  const aggregate = await tx.storageReservation.aggregate({
    where: {
      userId,
      expiresAt: { gt: now },
      document: { status: DocumentStatus.PENDING_UPLOAD },
    },
    _sum: { reservedBytes: true },
  });
  return aggregate._sum.reservedBytes ?? 0;
}

export async function computeUserStorageUsedBytesTx(
  tx: Prisma.TransactionClient,
  userId: string,
  now: Date,
): Promise<number> {
  const [avatar, committed, reserved] = await Promise.all([
    getAvatarUsageBytes(userId),
    sumCommittedDocumentBytesTx(tx, userId),
    sumActiveReservationBytesTx(tx, userId, now),
  ]);
  return avatar + committed + reserved;
}

export async function getUserStorageLimitBytes(userId: string): Promise<number> {
  const subscription = await getOrCreateUserSubscription(userId);
  const plan = resolveEffectivePlan(subscription);
  return PLAN_LIMITS[plan].storageBytes;
}

export async function assertStorageAllowanceTx(
  tx: Prisma.TransactionClient,
  userId: string,
  additionalBytes: number,
  now: Date,
): Promise<{ ok: true; limitBytes: number; usedBytes: number } | { ok: false; message: string }> {
  await acquireUserStorageQuotaLock(tx, userId);

  const subscription = await tx.subscription.findUnique({
    where: { userId },
    select: {
      plan: true,
      status: true,
      provider: true,
      currentPeriodStart: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true,
    },
  });
  const plan = subscription
    ? resolveEffectivePlan(subscription)
    : SubscriptionPlan.FREE;
  const limitBytes = PLAN_LIMITS[plan].storageBytes;
  const usedBytes = await computeUserStorageUsedBytesTx(tx, userId, now);

  if (usedBytes + additionalBytes > limitBytes) {
    return {
      ok: false,
      message: "Storage limit reached. Delete files or upgrade your plan.",
    };
  }

  return { ok: true, limitBytes, usedBytes };
}

/** Non-transactional total for billing display. */
export async function getDocumentStorageUsageBytes(userId: string): Promise<number> {
  const now = new Date();
  return prisma.$transaction(async (tx) => {
    const committed = await sumCommittedDocumentBytesTx(tx, userId);
    const reserved = await sumActiveReservationBytesTx(tx, userId, now);
    return committed + reserved;
  });
}
