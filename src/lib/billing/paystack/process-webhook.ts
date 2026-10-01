import "server-only";

import { prisma } from "@/lib/db";

import type { PaystackWebhookEvent, PaystackSubscriptionPayload } from "./types";
import {
  applyPaystackSubscriptionCreate,
  applyVerifiedTransactionToSubscription,
  downgradeMindVaultToFree,
  recordBillingProviderEvent,
  resolveUserIdForPaystackWebhook,
  resolveWebhookEventKey,
} from "./sync-subscription";
import { verifyPaystackTransaction } from "./verify-transaction";

export async function processPaystackWebhookEvent(event: PaystackWebhookEvent) {
  const eventKey = resolveWebhookEventKey(event.event, event.data);
  const recorded = await recordBillingProviderEvent(eventKey, event.event);
  if (!recorded.inserted) {
    return { ok: true as const, duplicate: true as const };
  }

  const userId = await resolveUserIdForPaystackWebhook(event.data);
  if (!userId) {
    return { ok: false as const, reason: "user_not_found" as const };
  }

  switch (event.event) {
    case "charge.success": {
      const reference =
        typeof event.data.reference === "string" ? event.data.reference : null;
      if (!reference) {
        return { ok: false as const, reason: "missing_reference" as const };
      }
      const verified = await verifyPaystackTransaction(reference);
      if (!verified.ok) {
        return { ok: false as const, reason: "verify_failed" as const };
      }
      await applyVerifiedTransactionToSubscription({ userId, data: verified.data });
      return { ok: true as const, handled: "charge.success" as const };
    }
    case "subscription.create": {
      await applyPaystackSubscriptionCreate({
        userId,
        payload: event.data as PaystackSubscriptionPayload,
      });
      return { ok: true as const, handled: "subscription.create" as const };
    }
    case "subscription.disable": {
      await downgradeMindVaultToFree(userId);
      return { ok: true as const, handled: "subscription.disable" as const };
    }
    case "subscription.not_renew": {
      await prisma.subscription.update({
        where: { userId },
        data: { cancelAtPeriodEnd: true },
      });
      return { ok: true as const, handled: "subscription.not_renew" as const };
    }
    default:
      return { ok: true as const, ignored: event.event };
  }
}
