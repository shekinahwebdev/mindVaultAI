"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, Clock, Crown } from "lucide-react";

import { UsageMeter } from "@/components/billing/UsageMeter";
import { formatStorageBytes } from "@/lib/billing/format";
import { planDisplayName } from "@/lib/billing/plans";
import { useSubscription } from "@/lib/billing/use-subscription";
import { VaultLogoutAction } from "@/components/vault/VaultLogoutAction";
import { fetchSettings } from "@/lib/settings/settings-client";
import { SETTINGS_LOAD_ERROR } from "@/lib/settings/settings-config";
import { vaultRoutes } from "@/lib/routes";
import { cn } from "@/lib/utils";

import {
  vaultDestructiveButton,
  vaultPrimaryButton,
  vaultSecondaryButton,
} from "../vault-controls";

import {
  settingsAsideCardClassName,
  settingsUtilityTitleClassName,
} from "./settings-ui";

export function SettingsAside() {
  const { subscription, loading: subscriptionLoading, error: subscriptionError } =
    useSubscription();
  const [activityLoading, setActivityLoading] = useState(true);
  const [noteCount, setNoteCount] = useState(0);
  const [activityError, setActivityError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchSettings().then(({ data }) => {
      if (cancelled) return;
      if (data?.ok) {
        setNoteCount(data.storage.totalNotes);
        setActivityError("");
      } else {
        setActivityError(data?.message || SETTINGS_LOAD_ERROR);
      }
      setActivityLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const usage = subscription?.usage;

  return (
    <aside className="flex min-w-0 flex-col gap-4">
      <section className={cn(settingsAsideCardClassName, "p-4 sm:p-5")}>
        <header className="flex items-center gap-2">
          <Crown aria-hidden className="size-4 text-amber-500/90" />
          <h2 className={settingsUtilityTitleClassName}>Plan &amp; Usage</h2>
        </header>

        <div className="mt-4 rounded-[var(--mv-radius-control)] border border-border bg-mv-panel/50 px-3.5 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[0.875rem] font-semibold text-foreground">
                {subscription ? planDisplayName(subscription.plan) : "Free Plan"}
              </p>
              <p className="mt-0.5 text-[0.75rem] text-muted-foreground">
                {subscription?.plan === "PRO"
                  ? "Pro limits on your workspace."
                  : "Core vault features on your workspace."}
              </p>
            </div>
            <Crown aria-hidden className="size-5 shrink-0 text-amber-500/80" />
          </div>
          <Link href={vaultRoutes.plans} className={cn(vaultPrimaryButton, "mt-3 w-full")}>
            Upgrade to Pro
          </Link>
        </div>

        {subscriptionLoading ? (
          <p className="mt-4 text-[0.75rem] text-muted-foreground">Loading usage…</p>
        ) : subscriptionError || !usage ? (
          <p className="mt-4 text-[0.75rem] text-muted-foreground">
            {subscriptionError || "Could not load usage."}
          </p>
        ) : (
          <div className="mt-4 space-y-3.5">
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
              usedLabel={formatStorageBytes(usage.storage.usedBytes)}
              limitLabel={formatStorageBytes(usage.storage.limitBytes)}
            />
          </div>
        )}
      </section>

      <section className={cn(settingsAsideCardClassName, "p-4 sm:p-5")}>
        <header className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock aria-hidden className="size-4 text-muted-foreground" />
            <h2 className={settingsUtilityTitleClassName}>Account Activity</h2>
          </div>
        </header>

        {activityLoading ? (
          <p className="mt-3 text-[0.75rem] text-muted-foreground">Loading activity…</p>
        ) : activityError ? (
          <p className="mt-3 text-[0.75rem] text-muted-foreground">{activityError}</p>
        ) : (
          <p className="mt-3 text-[0.8125rem] text-muted-foreground">
            You have{" "}
            <span className="font-medium text-foreground">{noteCount}</span> notes in your vault.
          </p>
        )}

        <div className="mt-4 space-y-2">
          <Link href={vaultRoutes.subscription} className={vaultSecondaryButton}>
            Subscription settings
          </Link>
          <VaultLogoutAction label="Sign out" className={vaultDestructiveButton} />
        </div>

        <div className="mt-4 flex gap-2 rounded-[var(--mv-radius-control)] border border-amber-500/25 bg-amber-500/5 px-3 py-2.5">
          <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-[0.6875rem] leading-relaxed text-muted-foreground">
            Deleting your account permanently removes notes, chat history, and preferences.
          </p>
        </div>
      </section>
    </aside>
  );
}
