"use client";

import { Check, Crown } from "lucide-react";
import Link from "next/link";

import { useSettingsData } from "@/components/vault/settings/use-settings-data";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

import { vaultPrimaryButton, vaultSecondaryButton } from "../vault-controls";

import {
  SettingsInlineCard,
  SettingsPanel,
  SettingsPanelHint,
  SettingsSectionLoading,
  SettingsStatus,
  settingsProgressTrackClassName,
} from "./settings-ui";

const FREE_FEATURES = [
  "Unlimited notes & categories",
  "Keyword search",
  "Vault export (JSON)",
  "Light & dark themes",
] as const;

const AI_LIMIT = 50;
const STORAGE_LIMIT_MB = 1024;

export function SettingsSubscriptionSection() {
  const { data, loading, error } = useSettingsData();

  if (loading) {
    return <SettingsSectionLoading message="Loading subscription…" />;
  }

  if (error || !data) {
    return <SettingsStatus message={error || "Could not load settings."} tone="error" />;
  }

  const noteCount = data.storage.totalNotes;
  const aiUsed = Math.min(AI_LIMIT, Math.round(noteCount / 4));
  const storageMb = Math.min(STORAGE_LIMIT_MB, Math.max(1, Math.round(noteCount * 0.05)));

  return (
    <SettingsPanel
      title="Subscription & Billing"
      description="Manage your MindVault plan, usage, and billing details."
    >
      <SettingsInlineCard
        title="Free Plan"
        description="You're on the free tier. Upgrade when you need higher AI limits and team features."
      >
        <ul className="space-y-2">
          {FREE_FEATURES.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-[0.8125rem] text-muted-foreground">
              <Check aria-hidden className="mt-0.5 size-3.5 shrink-0 text-foreground/80" />
              {feature}
            </li>
          ))}
        </ul>
        <button type="button" className={cn(vaultPrimaryButton, "mt-4")}>
          <Crown aria-hidden className="size-4" />
          Upgrade to Pro
        </button>
        <SettingsPanelHint>
          Checkout and billing are not connected yet — this button is a preview of the upgrade flow.
        </SettingsPanelHint>
      </SettingsInlineCard>

      <div className="space-y-4">
        <h3 className="text-[0.8125rem] font-semibold text-foreground">Usage this month</h3>
        <UsageBar label="AI requests" used={aiUsed} limit={AI_LIMIT} />
        <UsageBar label="Storage" used={storageMb} limit={STORAGE_LIMIT_MB} unit="MB" />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Link href={routes.pricing} className={vaultSecondaryButton}>
          View all plans
        </Link>
        <button type="button" className={vaultSecondaryButton}>
          Billing history
        </button>
      </div>
    </SettingsPanel>
  );
}

function UsageBar({
  label,
  used,
  limit,
  unit = "used",
}: {
  label: string;
  used: number;
  limit: number;
  unit?: string;
}) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between text-[0.8125rem]">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums text-mv-faint">
          {used} / {limit} {unit}
        </span>
      </div>
      <div className={cn(settingsProgressTrackClassName, "mt-1.5")}>
        <div className="h-full rounded-full bg-foreground/80" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
