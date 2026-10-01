import type { SubscriptionPlan } from "@/generated/prisma/enums";

export type PlanId = keyof typeof PLAN_LIMITS;

/** Product limits — single source of truth for API and UI. */
export const PLAN_LIMITS = {
  FREE: {
    aiRequestsMonthly: 50,
    storageBytes: 1 * 1024 * 1024 * 1024,
  },
  PRO: {
    aiRequestsMonthly: 2_000,
    storageBytes: 10 * 1024 * 1024 * 1024,
  },
} as const satisfies Record<
  SubscriptionPlan,
  { aiRequestsMonthly: number; storageBytes: number }
>;

export type PlanFeatureFlags = {
  notes: boolean;
  categories: boolean;
  tags: boolean;
  semanticSearch: boolean;
  rag: boolean;
  agent: boolean;
  documentUpload: boolean;
};

const BASE_FEATURES: PlanFeatureFlags = {
  notes: true,
  categories: true,
  tags: true,
  semanticSearch: true,
  rag: true,
  agent: false,
  documentUpload: false,
};

export function getPlanFeatureFlags(_plan: SubscriptionPlan): PlanFeatureFlags {
  return { ...BASE_FEATURES };
}

export function planDisplayName(plan: SubscriptionPlan): string {
  return plan === "PRO" ? "Pro Plan" : "Free Plan";
}

export function isPaidPlan(plan: SubscriptionPlan): boolean {
  return plan === "PRO";
}

