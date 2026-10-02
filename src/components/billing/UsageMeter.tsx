"use client";

import { cn } from "@/lib/utils";
import { clampUsagePercent } from "@/lib/billing/format";

import { settingsProgressTrackClassName } from "@/components/vault/settings/settings-ui";

type UsageMeterProps = {
  label: string;
  usedLabel: string;
  limitLabel: string;
  used: number;
  limit: number;
  warnAtPercent?: number;
  className?: string;
};

export function UsageMeter({
  label,
  usedLabel,
  limitLabel,
  used,
  limit,
  warnAtPercent = 80,
  className,
}: UsageMeterProps) {
  const pct = clampUsagePercent(used, limit);
  const nearLimit = pct >= warnAtPercent;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2 text-[0.8125rem]">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums text-mv-faint">
          {usedLabel} / {limitLabel}
        </span>
      </div>
      <div className={settingsProgressTrackClassName}>
        <div
          className={cn(
            "h-full rounded-full transition-[width]",
            nearLimit ? "bg-amber-500/90" : "bg-foreground/80",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {nearLimit ? (
        <p className="text-[0.6875rem] text-amber-600 dark:text-amber-400/90">
          {usedLabel} of {limitLabel} used this month
        </p>
      ) : null}
    </div>
  );
}
