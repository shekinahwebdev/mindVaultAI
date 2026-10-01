import { UsageEventType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";

import { getUtcCalendarMonthPeriod } from "./period";

const AI_USAGE_TYPES: UsageEventType[] = [
  UsageEventType.AI_ANALYZE,
  UsageEventType.AI_CHAT,
];

export async function countAiRequestsInCurrentPeriod(userId: string): Promise<number> {
  const { periodStart, periodEnd } = getUtcCalendarMonthPeriod();

  const aggregate = await prisma.usageEvent.aggregate({
    where: {
      userId,
      type: { in: AI_USAGE_TYPES },
      createdAt: { gte: periodStart, lt: periodEnd },
    },
    _sum: { quantity: true },
  });

  return aggregate._sum.quantity ?? 0;
}

export async function requireAiAllowance(params: {
  userId: string;
  limit: number;
}): Promise<{ ok: true; used: number } | { ok: false; used: number; limit: number }> {
  const used = await countAiRequestsInCurrentPeriod(params.userId);
  if (used >= params.limit) {
    return { ok: false, used, limit: params.limit };
  }
  return { ok: true, used };
}

/**
 * Records one user-facing AI request after a successful generative provider call.
 * Uses a transaction to reduce concurrent over-count risk on small workloads.
 */
export async function recordAiUsage(userId: string, type: UsageEventType) {
  await prisma.$transaction(async (tx) => {
    await tx.usageEvent.create({
      data: {
        userId,
        type,
        quantity: 1,
      },
    });
  });
}
