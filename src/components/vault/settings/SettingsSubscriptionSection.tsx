"use client";

import { Check, Crown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { UsageMeter } from "@/components/billing/UsageMeter";
import {
  cancelPaystackSubscription,
  fetchPaystackManageUrl,
  startPaystackCheckout,
} from "@/lib/billing/billing-client";
import { formatStorageBytes } from "@/lib/billing/format";
import { planDisplayName, PLAN_LIMITS } from "@/lib/billing/plans";
import { useSubscription } from "@/lib/billing/use-subscription";
import { vaultRoutes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { toastError, toastSuccess } from "@/lib/vault-toast";

import { vaultPrimaryButton, vaultSecondaryButton } from "../vault-controls";

import {
  SettingsInlineCard,
  SettingsPanel,
  SettingsPanelHint,
  SettingsSectionLoading,
  SettingsStatus,
} from "./settings-ui";

const FREE_FEATURES = [
  "Unlimited notes & categories",
  "Keyword & semantic search",
  "Vault export (JSON)",
  "Ask MindVault with monthly AI quota",
] as const;

const PRO_FEATURES = [
  "Everything in Free",
  "Higher monthly AI request allowance",
  "More file storage for uploads (when available)",
  "Priority access to new AI features",
] as const;

export function SettingsSubscriptionSection() {
  const { subscription, loading, error, refresh } = useSubscription();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [billingActionLoading, setBillingActionLoading] = useState(false);

  async function handleUpgrade() {
    setCheckoutLoading(true);
    const result = await startPaystackCheckout();
    setCheckoutLoading(false);

    if (!result.ok) {
      toastError(result.message || "Could not start checkout.");
      return;
    }

    if ("alreadyPro" in result && result.alreadyPro) {
      toastSuccess(result.message);
      await refresh();
      return;
    }

    if ("authorizationUrl" in result) {
      window.location.assign(result.authorizationUrl);
    }
  }

  async function handleManage() {
    setBillingActionLoading(true);
    const result = await fetchPaystackManageUrl();
    setBillingActionLoading(false);
    if (!result.ok) {
      toastError(result.message || "Could not open Paystack management.");
      return;
    }
    window.open(result.manageUrl, "_blank", "noopener,noreferrer");
  }

  async function handleCancel() {
    setBillingActionLoading(true);
    const result = await cancelPaystackSubscription();
    setBillingActionLoading(false);
    if (!result.ok) {
      toastError(result.message || "Could not cancel subscription.");
      return;
    }
    toastSuccess(result.message);
    await refresh();
  }

  if (loading) {
    return <SettingsSectionLoading message="Loading subscription…" />;
  }

  if (error || !subscription) {
    return <SettingsStatus message={error || "Could not load subscription."} tone="error" />;
  }

  const { plan, usage, billing } = subscription;
  const storageUsed = formatStorageBytes(usage.storage.usedBytes);
  const storageLimit = formatStorageBytes(usage.storage.limitBytes);
  const features = plan === "PRO" ? PRO_FEATURES : FREE_FEATURES;

  return (
    <SettingsPanel
      title="Subscription & Billing"
      description="Manage your MindVault plan, usage, and billing details."
    >
      <SettingsInlineCard
        title={planDisplayName(plan)}
        description={
          plan === "PRO"
            ? `Active${billing.currentPeriodEnd ? ` · renews ${new Date(billing.currentPeriodEnd).toLocaleDateString()}` : ""}`
            : "You're on the free tier. Upgrade when you need higher limits."
        }
      >
        <ul className="space-y-2">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-[0.8125rem] text-muted-foreground">
              <Check aria-hidden className="mt-0.5 size-3.5 shrink-0 text-foreground/80" />
              {feature}
            </li>
          ))}
        </ul>

        {plan === "FREE" && billing.checkoutAvailable ? (
          <button
            type="button"
            disabled={checkoutLoading}
            onClick={() => void handleUpgrade()}
            className={cn(vaultPrimaryButton, "mt-4")}
          >
            <Crown aria-hidden className="size-4" />
            {checkoutLoading ? "Starting checkout…" : "Upgrade to Pro"}
          </button>
        ) : null}

        {plan === "FREE" && !billing.checkoutAvailable ? (
          <Link href={vaultRoutes.plans} className={cn(vaultPrimaryButton, "mt-4 inline-flex")}>
            View Pro benefits
          </Link>
        ) : null}

        {plan === "PRO" && billing.canManagePaystack ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={billingActionLoading}
              onClick={() => void handleManage()}
              className={vaultSecondaryButton}
            >
              Manage payment method
            </button>
            {billing.canCancelPaystack ? (
              <button
                type="button"
                disabled={billingActionLoading}
                onClick={() => void handleCancel()}
                className={vaultSecondaryButton}
              >
                Cancel subscription
              </button>
            ) : null}
          </div>
        ) : null}

        {billing.checkoutAvailable ? (
          <SettingsPanelHint>
            Checkout uses Paystack test mode. Pro activates only after Paystack confirms payment
            (callback + webhook).
          </SettingsPanelHint>
        ) : (
          <SettingsPanelHint>
            Add Paystack test keys to enable checkout. Usage limits below are always live.
          </SettingsPanelHint>
        )}
      </SettingsInlineCard>

      <div className="space-y-4">
        <h3 className="text-[0.8125rem] font-semibold text-foreground">Usage this month</h3>
        <UsageMeter
          label="AI requests"
          used={usage.aiRequests.used}
          limit={usage.aiRequests.limit}
          usedLabel={String(usage.aiRequests.used)}
          limitLabel={String(usage.aiRequests.limit)}
        />
        <UsageMeter
          label="Storage (uploaded files)"
          used={usage.storage.usedBytes}
          limit={usage.storage.limitBytes}
          usedLabel={storageUsed}
          limitLabel={storageLimit}
        />
        <p className="text-[0.6875rem] leading-relaxed text-mv-faint">
          AI usage resets on{" "}
          {new Date(usage.aiRequests.resetsAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
            timeZone: "UTC",
          })}{" "}
          (UTC).
        </p>
        <button
          type="button"
          className="text-[0.75rem] text-muted-foreground underline-offset-2 hover:underline"
          onClick={() => void refresh()}
        >
          Refresh usage
        </button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Link href={vaultRoutes.plans} className={vaultSecondaryButton}>
          View all plans
        </Link>
        {billing.historyAvailable ? (
          <button type="button" className={vaultSecondaryButton} disabled>
            Billing history (coming soon)
          </button>
        ) : (
          <button type="button" className={vaultSecondaryButton} disabled>
            No billing history yet
          </button>
        )}
      </div>

      <SettingsPanelHint>
        Free includes {PLAN_LIMITS.FREE.aiRequestsMonthly} AI requests and{" "}
        {formatStorageBytes(PLAN_LIMITS.FREE.storageBytes)} storage. Pro includes{" "}
        {PLAN_LIMITS.PRO.aiRequestsMonthly.toLocaleString()} AI requests and{" "}
        {formatStorageBytes(PLAN_LIMITS.PRO.storageBytes)} storage.
      </SettingsPanelHint>
    </SettingsPanel>
  );
}
