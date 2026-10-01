import "server-only";

import { BillingProvider } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";

import { isPaystackCheckoutEnabled } from "./paystack/config";

export async function getSubscriptionBillingMeta(userId: string) {
  const [subscription, transactionCount] = await Promise.all([
    prisma.subscription.findUnique({
      where: { userId },
      select: {
        status: true,
        provider: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
        providerSubscriptionId: true,
        providerEmailToken: true,
      },
    }),
    prisma.billingTransaction.count({ where: { userId } }),
  ]);

  const canManage =
    subscription?.provider === BillingProvider.PAYSTACK &&
    Boolean(subscription.providerSubscriptionId);

  const canCancel =
    canManage && Boolean(subscription?.providerEmailToken);

  return {
    checkoutAvailable: isPaystackCheckoutEnabled(),
    historyAvailable: transactionCount > 0,
    provider: subscription?.provider ?? "NONE",
    subscriptionStatus: subscription?.status ?? "ACTIVE",
    currentPeriodEnd: subscription?.currentPeriodEnd?.toISOString() ?? null,
    cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
    canManagePaystack: canManage,
    canCancelPaystack: canCancel,
  };
}
