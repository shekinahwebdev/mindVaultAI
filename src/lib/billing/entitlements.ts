import type { SubscriptionPlan } from "@/generated/prisma/enums";

import { getPlanFeatureFlags, PLAN_LIMITS } from "./plans";
import { getUtcCalendarMonthPeriod } from "./period";
import {
  getOrCreateUserSubscription,
  resolveEffectivePlan,
} from "./subscription-repository";
import { getUserStorageUsageBytes } from "./storage";
import { countAiRequestsInCurrentPeriod } from "./usage-metering";

export type UserEntitlements = {
  plan: SubscriptionPlan;
  status: string;
  aiRequests: {
    limit: number;
    used: number;
    remaining: number;
    resetsAt: string;
  };
  storage: {
    limitBytes: number;
    usedBytes: number;
    remainingBytes: number;
  };
  features: ReturnType<typeof getPlanFeatureFlags>;
};

export async function getUserEntitlements(userId: string): Promise<UserEntitlements> {
  const [subscription, usedAi, usedStorageBytes] = await Promise.all([
    getOrCreateUserSubscription(userId),
    countAiRequestsInCurrentPeriod(userId),
    getUserStorageUsageBytes(userId),
  ]);

  const plan = resolveEffectivePlan(subscription);
  const limits = PLAN_LIMITS[plan];
  const { periodEnd } = getUtcCalendarMonthPeriod();

  const remainingAi = Math.max(0, limits.aiRequestsMonthly - usedAi);
  const remainingStorage = Math.max(0, limits.storageBytes - usedStorageBytes);

  return {
    plan,
    status: subscription.status,
    aiRequests: {
      limit: limits.aiRequestsMonthly,
      used: usedAi,
      remaining: remainingAi,
      resetsAt: periodEnd.toISOString(),
    },
    storage: {
      limitBytes: limits.storageBytes,
      usedBytes: usedStorageBytes,
      remainingBytes: remainingStorage,
    },
    features: getPlanFeatureFlags(plan),
  };
}
