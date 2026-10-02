import {
  BillingProvider,
  SubscriptionPlan,
  SubscriptionStatus,
} from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";

const subscriptionSelect = {
  plan: true,
  status: true,
  provider: true,
  currentPeriodStart: true,
  currentPeriodEnd: true,
  cancelAtPeriodEnd: true,
} as const;

export type UserSubscriptionRow = {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  provider: BillingProvider;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
};

export async function getOrCreateUserSubscription(
  userId: string,
): Promise<UserSubscriptionRow> {
  const existing = await prisma.subscription.findUnique({
    where: { userId },
    select: subscriptionSelect,
  });

  if (existing) {
    return existing;
  }

  return prisma.subscription.create({
    data: {
      userId,
      plan: SubscriptionPlan.FREE,
      status: SubscriptionStatus.ACTIVE,
      provider: BillingProvider.NONE,
    },
    select: subscriptionSelect,
  });
}

export async function ensureFreeSubscriptionForNewUser(userId: string) {
  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      plan: SubscriptionPlan.FREE,
      status: SubscriptionStatus.ACTIVE,
      provider: BillingProvider.NONE,
    },
    update: {},
  });
}

/** Resolves effective plan — inactive paid rows fall back to Free limits until webhook phase. */
export function resolveEffectivePlan(subscription: UserSubscriptionRow): SubscriptionPlan {
  if (
    subscription.plan === SubscriptionPlan.PRO &&
    (subscription.status === SubscriptionStatus.ACTIVE ||
      subscription.status === SubscriptionStatus.TRIALING)
  ) {
    return SubscriptionPlan.PRO;
  }
  return SubscriptionPlan.FREE;
}
