"use client";

import Link from "next/link";
import { Crown } from "lucide-react";
import { useState } from "react";

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
        className="group relative mx-auto flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-[var(--mv-sidebar-nav-hover-bg)] hover:text-sidebar-foreground"
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
      <div className="mx-0.5 rounded-[var(--mv-radius-control)] border border-sidebar-border bg-sidebar-accent/60 px-2.5 py-2">
        <p className="text-[0.6875rem] text-muted-foreground">Loading plan…</p>
      </div>
    );
  }

  const { plan, usage } = subscription;
  const storageUsed = formatStorageBytes(usage.storage.usedBytes);
  const storageLimit = formatStorageBytes(usage.storage.limitBytes);

  return (
    <div
      className={cn(
        "mx-0.5 rounded-[var(--mv-radius-control)] border border-sidebar-border bg-sidebar-accent/60 px-2.5 py-2 transition-opacity",
        !expanded && "pointer-events-none opacity-0",
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[0.75rem] font-semibold text-foreground">
          {planDisplayName(plan)}
        </p>
        <p className="text-right text-[0.625rem] leading-snug text-muted-foreground tabular-nums">
          AI {usage.aiRequests.used}/{usage.aiRequests.limit}
          <span className="mx-0.5 text-border">·</span>
          {storageUsed}/{storageLimit}
        </p>
      </div>

      {plan === "FREE" ? (
        subscription.billing.checkoutAvailable ? (
          <button
            type="button"
            disabled={checkoutLoading}
            onClick={() => void handleUpgrade()}
            className={cn(
              vaultPrimaryButton,
              "mt-2 h-8 w-full text-[0.6875rem] font-semibold",
            )}
          >
            {checkoutLoading ? "Starting…" : "Upgrade to Pro"}
          </button>
        ) : (
          <Link
            href={vaultRoutes.plans}
            className={cn(
              vaultPrimaryButton,
              "mt-2 h-8 w-full text-[0.6875rem] font-semibold",
            )}
          >
            Upgrade to Pro
          </Link>
        )
      ) : (
        <Link
          href={vaultRoutes.subscription}
          className={cn(
            vaultPrimaryButton,
            "mt-2 h-8 w-full text-[0.6875rem] font-semibold",
          )}
        >
          Manage plan
        </Link>
      )}
    </div>
  );
}