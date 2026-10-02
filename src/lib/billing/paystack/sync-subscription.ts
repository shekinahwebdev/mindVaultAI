import "server-only";

import {
  BillingProvider,
  SubscriptionPlan,
  SubscriptionStatus,
} from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";

import { getPaystackProPlanCode } from "./config";
import type { PaystackSubscriptionPayload, PaystackVerifyTransactionData } from "./types";
import { parsePaystackMetadata } from "./verify-transaction";

function parseDate(value: string | undefined): Date | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function buildCheckoutReference(userId: string): string {
  const suffix = Date.now().toString(36);
  const compact = userId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12);
  return `mv_${compact}_${suffix}`.slice(0, 100);
}

export async function recordBillingProviderEvent(eventKey: string, eventType: string) {
  try {
    await prisma.billingProviderEvent.create({
      data: { eventKey, eventType },
    });
    return { inserted: true as const };
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return { inserted: false as const };
    }
    throw error;
  }
}

export async function upsertVerifiedTransaction(params: {
  userId: string;
  subscriptionId?: string | null;
  reference: string;
  amount: number;
  currency: string;
  status: string;
  paidAt?: Date | null;
}) {
  await prisma.billingTransaction.upsert({
    where: { providerReference: params.reference },
    create: {
      userId: params.userId,
      subscriptionId: params.subscriptionId ?? null,
      provider: BillingProvider.PAYSTACK,
      providerReference: params.reference,
      amount: params.amount,
      currency: params.currency,
      status: params.status,
      paidAt: params.paidAt ?? null,
    },
    update: {
      status: params.status,
      paidAt: params.paidAt ?? null,
    },
  });
}

export async function activateMindVaultProFromPaystack(params: {
  userId: string;
  customerCode?: string | null;
  subscriptionCode?: string | null;
  emailToken?: string | null;
  planCode?: string | null;
  periodEnd?: Date | null;
  checkoutReference?: string | null;
}) {
  const configuredPlan = getPaystackProPlanCode();
  if (params.planCode && configuredPlan && params.planCode !== configuredPlan) {
    throw new Error("Unexpected Paystack plan code.");
  }

  await prisma.subscription.update({
    where: { userId: params.userId },
    data: {
      plan: SubscriptionPlan.PRO,
      status: SubscriptionStatus.ACTIVE,
      provider: BillingProvider.PAYSTACK,
      providerCustomerId: params.customerCode ?? undefined,
      providerSubscriptionId: params.subscriptionCode ?? undefined,
      providerPlanCode: params.planCode ?? configuredPlan ?? undefined,
      providerEmailToken: params.emailToken ?? undefined,
      pendingCheckoutReference: null,
      cancelAtPeriodEnd: false,
      currentPeriodStart: new Date(),
      currentPeriodEnd: params.periodEnd ?? undefined,
    },
  });
}

export async function downgradeMindVaultToFree(userId: string) {
  await prisma.subscription.update({
    where: { userId },
    data: {
      plan: SubscriptionPlan.FREE,
      status: SubscriptionStatus.ACTIVE,
      provider: BillingProvider.NONE,
      providerCustomerId: null,
      providerSubscriptionId: null,
      providerPlanCode: null,
      providerEmailToken: null,
      pendingCheckoutReference: null,
      cancelAtPeriodEnd: false,
      currentPeriodStart: null,
      currentPeriodEnd: null,
    },
  });
}

export async function applyVerifiedTransactionToSubscription(params: {
  userId: string;
  data: PaystackVerifyTransactionData;
}) {
  const { data } = params;
  if (data.status !== "success") {
    return { activated: false as const, reason: "not_successful" as const };
  }

  if (data.domain && data.domain !== "test") {
    return { activated: false as const, reason: "not_test_domain" as const };
  }

  const metadata = parsePaystackMetadata(data.metadata);
  const metadataUserId =
    typeof metadata.mindvault_user_id === "string" ? metadata.mindvault_user_id : null;

  if (metadataUserId && metadataUserId !== params.userId) {
    throw new Error("Transaction metadata user mismatch.");
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId: params.userId },
    select: { id: true },
  });

  await upsertVerifiedTransaction({
    userId: params.userId,
    subscriptionId: subscription?.id,
    reference: data.reference,
    amount: data.amount,
    currency: data.currency,
    status: data.status,
    paidAt: parseDate(data.paid_at),
  });

  const planCode =
    (typeof data.plan_object === "object" &&
      data.plan_object &&
      "plan_code" in data.plan_object &&
      typeof data.plan_object.plan_code === "string" &&
      data.plan_object.plan_code) ||
    getPaystackProPlanCode();

  await activateMindVaultProFromPaystack({
    userId: params.userId,
    customerCode: data.customer?.customer_code ?? null,
    planCode,
    checkoutReference: data.reference,
  });

  return { activated: true as const };
}

export async function applyPaystackSubscriptionCreate(params: {
  userId: string;
  payload: PaystackSubscriptionPayload & Record<string, unknown>;
}) {
  const planCode =
    params.payload.plan?.plan_code ??
    (typeof params.payload.plan_code === "string" ? params.payload.plan_code : null) ??
    getPaystackProPlanCode();

  const subscriptionCode =
    params.payload.subscription_code ??
    (typeof params.payload.code === "string" ? params.payload.code : null);

  const emailToken =
    params.payload.email_token ??
    (typeof params.payload.token === "string" ? params.payload.token : null);

  await activateMindVaultProFromPaystack({
    userId: params.userId,
    customerCode: params.payload.customer?.customer_code ?? null,
    subscriptionCode,
    emailToken,
    planCode,
    periodEnd: parseDate(params.payload.next_payment_date),
  });
}

export function resolveWebhookEventKey(event: string, data: Record<string, unknown>) {
  const reference =
    (typeof data.reference === "string" && data.reference) ||
    (typeof data.id === "string" && data.id) ||
    (typeof data.id === "number" && String(data.id)) ||
    (typeof data.subscription_code === "string" && data.subscription_code) ||
    "unknown";
  return `${event}:${reference}`;
}

export function extractMindVaultUserIdFromWebhookData(
  data: Record<string, unknown>,
): string | null {
  const metadata = data.metadata;
  if (typeof metadata === "object" && metadata !== null && !Array.isArray(metadata)) {
    const userId = (metadata as Record<string, unknown>).mindvault_user_id;
    if (typeof userId === "string") {
      return userId;
    }
  }
  if (typeof metadata === "string") {
    try {
      const parsed = JSON.parse(metadata) as Record<string, unknown>;
      if (typeof parsed.mindvault_user_id === "string") {
        return parsed.mindvault_user_id;
      }
    } catch {
      return null;
    }
  }
  return null;
}

export async function resolveUserIdForPaystackWebhook(
  data: Record<string, unknown>,
): Promise<string | null> {
  const fromMetadata = extractMindVaultUserIdFromWebhookData(data);
  if (fromMetadata) {
    return fromMetadata;
  }

  const reference = typeof data.reference === "string" ? data.reference : null;
  if (reference) {
    const byPending = await prisma.subscription.findFirst({
      where: { pendingCheckoutReference: reference },
      select: { userId: true },
    });
    if (byPending) {
      return byPending.userId;
    }
  }

  const customerEmail =
    typeof data.customer === "object" &&
    data.customer !== null &&
    "email" in data.customer &&
    typeof (data.customer as { email?: string }).email === "string"
      ? (data.customer as { email: string }).email
      : null;

  if (customerEmail) {
    const user = await prisma.user.findFirst({
      where: { email: customerEmail.toLowerCase() },
      select: { id: true },
    });
    return user?.id ?? null;
  }

  const subscriptionCode =
    typeof data.subscription_code === "string" ? data.subscription_code : null;
  if (subscriptionCode) {
    const sub = await prisma.subscription.findFirst({
      where: { providerSubscriptionId: subscriptionCode },
      select: { userId: true },
    });
    return sub?.userId ?? null;
  }

  return null;
}
