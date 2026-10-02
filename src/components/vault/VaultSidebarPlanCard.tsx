"use client";

import Link from "next/link";
import { Crown } from "lucide-react";
import { useState } from "react";

import { UsageMeter } from "@/components/billing/UsageMeter";
import { formatStorageBytes } from "@/lib/billing/format";
import { startPaystackCheckout } from "@/lib/billing/billing-client";
import { planDisplayName } from "@/lib/billing/plans";
import { toastError } from "@/lib/vault-toast";
import { useSubscription } from "@/lib/billing/use-subscription";
import { vaultRoutes } from "@/lib/routes";
import { cn } from "@/lib/utils";

import { vaultPrimaryButton, vaultRailTooltipClassName } from "./vault-controls";

type VaultSidebarPlanCardProps = {
  collapsed: boolean;
  expanded: boolean;
};

export function VaultSidebarPlanCard({ collapsed, expanded }: VaultSidebarPlanCardProps) {
  const { subscription, loading } = useSubscription();
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  async function handleUpgrade() {
    setCheckoutLoading(true);
    const result = await startPaystackCheckout();
    setCheckoutLoading(false);
    if (!result.ok) {
      toastError(result.message || "Could not start checkout.");
      return;
    }
    if ("authorizationUrl" in result) {
      window.location.assign(result.authorizationUrl);
    }
  }

  if (collapsed) {
    return (
      <Link
        href={vaultRoutes.subscription}
        className="group relative mx-auto flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-mv-panel/80 hover:text-foreground"
        aria-label={
          subscription
            ? `${planDisplayName(subscription.plan)} · ${subscription.usage.aiRequests.used} of ${subscription.usage.aiRequests.limit} AI requests`
            : "Plan and subscription"
        }
      >
        <Crown aria-hidden className="size-[1.125rem] stroke-[1.75] text-amber-500/90" />
        <span className={vaultRailTooltipClassName}>
          {subscription
            ? `${planDisplayName(subscription.plan)} · ${subscription.usage.aiRequests.used}/${subscription.usage.aiRequests.limit} AI`
            : "Plan & subscription"}
        </span>
      </Link>
    );
  }

  if (loading || !subscription) {
    return (
      <div className="mx-0.5 rounded-[var(--mv-radius-control)] border border-border/70 bg-mv-panel/40 px-3 py-2.5">
        <p className="text-[0.75rem] text-muted-foreground">Loading plan…</p>
      </div>
    );
  }

  const { plan, usage } = subscription;
  const storageUsed = formatStorageBytes(usage.storage.usedBytes);
  const storageLimit = formatStorageBytes(usage.storage.limitBytes);

  return (
    <div
      className={cn(
        "mx-0.5 rounded-[var(--mv-radius-control)] border border-border/70 bg-mv-panel/40 px-3 py-3 transition-opacity",
        !expanded && "opacity-0 pointer-events-none",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[0.8125rem] font-semibold text-foreground">
            {planDisplayName(plan)}
          </p>
          <p className="mt-0.5 text-[0.6875rem] leading-snug text-muted-foreground">
            {plan === "PRO" ? "Higher limits on your workspace." : "Upgrade for more power"}
          </p>
        </div>
        <Crown aria-hidden className="size-4 shrink-0 text-amber-500/90" />
      </div>

      <div className="mt-3 space-y-3">
        <UsageMeter
          label="AI requests"
          used={usage.aiRequests.used}
          limit={usage.aiRequests.limit}
          usedLabel={String(usage.aiRequests.used)}
          limitLabel={String(usage.aiRequests.limit)}
        />
        <UsageMeter
          label="Storage"
          used={usage.storage.usedBytes}
          limit={usage.storage.limitBytes}
          usedLabel={storageUsed}
          limitLabel={storageLimit}
        />
      </div>

      {plan === "FREE" ? (
        subscription.billing.checkoutAvailable ? (
          <button
            type="button"
            disabled={checkoutLoading}
            onClick={() => void handleUpgrade()}
            className={cn(vaultPrimaryButton, "mt-3 w-full")}
          >
            {checkoutLoading ? "Starting…" : "Upgrade to Pro"}
          </button>
        ) : (
          <Link href={vaultRoutes.plans} className={cn(vaultPrimaryButton, "mt-3 w-full")}>
            Upgrade to Pro
          </Link>
        )
      ) : (
        <Link
          href={vaultRoutes.subscription}
          className={cn(vaultPrimaryButton, "mt-3 w-full")}
        >
          Manage plan
        </Link>
      )}
    </div>
  );
}
