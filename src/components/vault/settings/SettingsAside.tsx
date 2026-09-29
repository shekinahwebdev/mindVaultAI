"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, Clock, Crown } from "lucide-react";

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
  settingsProgressTrackClassName,
  settingsUtilityTitleClassName,
} from "./settings-ui";

const AI_REQUEST_LIMIT = 50;
const STORAGE_LIMIT_MB = 1024;

function estimateStorageMb(noteCount: number) {
  return Math.min(STORAGE_LIMIT_MB, Math.max(1, Math.round(noteCount * 0.05)));
}

function UsageBar({
  label,
  used,
  limit,
  unit,
}: {
  label: string;
  used: number;
  limit: number;
  unit: string;
}) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2 text-[0.75rem]">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums text-mv-faint">
          {used} / {limit} {unit}
        </span>
      </div>
      <div className={settingsProgressTrackClassName}>
        <div
          className="h-full rounded-full bg-foreground/80 transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function SettingsAside() {
  const [loading, setLoading] = useState(true);
  const [noteCount, setNoteCount] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchSettings().then(({ data }) => {
      if (cancelled) return;
      if (data?.ok) {
        setNoteCount(data.storage.totalNotes);
        setError("");
      } else {
        setError(data?.message || SETTINGS_LOAD_ERROR);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const storageMb = estimateStorageMb(noteCount);
  const aiUsed = Math.min(AI_REQUEST_LIMIT, Math.round(noteCount / 4));

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
              <p className="text-[0.875rem] font-semibold text-foreground">Free Plan</p>
              <p className="mt-0.5 text-[0.75rem] text-muted-foreground">
                Core vault features on your workspace.
              </p>
            </div>
            <Crown aria-hidden className="size-5 shrink-0 text-amber-500/80" />
          </div>
          <Link
            href={vaultRoutes.subscription}
            className={cn(vaultPrimaryButton, "mt-3 w-full")}
          >
            Upgrade to Pro
          </Link>
        </div>

        {loading ? (
          <p className="mt-4 text-[0.75rem] text-muted-foreground">Loading usage…</p>
        ) : error ? (
          <p className="mt-4 text-[0.75rem] text-muted-foreground">{error}</p>
        ) : (
          <div className="mt-4 space-y-3.5">
            <UsageBar
              label="AI requests"
              used={aiUsed}
              limit={AI_REQUEST_LIMIT}
              unit="used"
            />
            <UsageBar
              label="Storage"
              used={storageMb}
              limit={STORAGE_LIMIT_MB}
              unit="MB"
            />
            <p className="text-[0.6875rem] leading-relaxed text-mv-faint">
              Usage bars are estimates until billing meters ship.
            </p>
          </div>
        )}
      </section>

      <section className={cn(settingsAsideCardClassName, "p-4 sm:p-5")}>
        <header className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock aria-hidden className="size-4 text-muted-foreground" />
            <h2 className={settingsUtilityTitleClassName}>Account Activity</h2>
          </div>
          <Link
            href={vaultRoutes.notes}
            className="text-[0.75rem] font-medium text-muted-foreground hover:text-foreground"
          >
            View notes
          </Link>
        </header>
        <ul className="mt-4 space-y-3">
          <li className="border-b border-border/80 pb-3 last:border-0 last:pb-0">
            <p className="text-[0.8125rem] font-medium text-foreground">Signed in</p>
            <p className="mt-0.5 text-[0.75rem] text-muted-foreground">This browser session</p>
            <span className="mt-1.5 inline-flex rounded-md border border-border bg-mv-panel px-1.5 py-0.5 text-[0.6875rem] text-mv-faint">
              Web
            </span>
          </li>
          {!loading && noteCount > 0 ? (
            <li>
              <p className="text-[0.8125rem] font-medium text-foreground">Vault active</p>
              <p className="mt-0.5 text-[0.75rem] text-muted-foreground">
                {noteCount === 1 ? "1 note saved" : `${noteCount} notes saved`}
              </p>
            </li>
          ) : null}
        </ul>
      </section>

      <section
        className={cn(
          settingsAsideCardClassName,
          "border-red-400/15 bg-red-400/[0.03] p-4 sm:p-5",
        )}
      >
        <header className="flex items-center gap-2">
          <AlertTriangle aria-hidden className="size-4 text-red-500/90" />
          <h2 className={settingsUtilityTitleClassName}>Danger Zone</h2>
        </header>

        <ul className="mt-4 space-y-4">
          <li className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[0.8125rem] font-medium text-foreground">
                Sign out from all devices
              </p>
              <p className="text-[0.75rem] text-muted-foreground">
                Ends this browser session (device list not tracked yet).
              </p>
            </div>
            <VaultLogoutAction
              label="Sign out all"
              className={cn(vaultSecondaryButton, "shrink-0 px-3")}
            />
          </li>
          <li className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[0.8125rem] font-medium text-foreground">Delete all data</p>
              <p className="text-[0.75rem] text-muted-foreground">
                Export first, then delete your account to remove vault data.
              </p>
            </div>
            <Link
              href={`${vaultRoutes.settings}/data`}
              className={cn(vaultDestructiveButton, "shrink-0 px-3")}
            >
              Manage data
            </Link>
          </li>
          <li className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[0.8125rem] font-medium text-foreground">Delete account</p>
              <p className="text-[0.75rem] text-muted-foreground">
                Permanently remove your account and vault.
              </p>
            </div>
            <Link
              href={`${vaultRoutes.settings}/advanced`}
              className={cn(vaultDestructiveButton, "shrink-0 px-3")}
            >
              Delete account
            </Link>
          </li>
        </ul>
      </section>
    </aside>
  );
}
