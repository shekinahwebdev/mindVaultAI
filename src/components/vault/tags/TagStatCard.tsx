"use client";

import type { LucideIcon } from "lucide-react";

import { mvContentCardClassName } from "@/lib/mv/layout-tokens";
import { cn } from "@/lib/utils";

type TagStatCardProps = {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
};

export function TagStatCard({ label, value, hint, icon: Icon }: TagStatCardProps) {
  return (
    <article
      className={cn(
        mvContentCardClassName,
        "flex min-w-0 items-center gap-3 px-4 py-3.5 sm:py-4",
      )}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-[var(--mv-radius-control)] border border-border bg-mv-panel text-muted-foreground">
        <Icon aria-hidden className="size-[1.125rem] stroke-[1.75]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[0.75rem] font-medium text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate text-[1.375rem] font-semibold tabular-nums tracking-[-0.02em] text-foreground">
          {value}
        </p>
        {hint ? (
          <p className="mt-0.5 truncate text-[0.6875rem] text-mv-faint">{hint}</p>
        ) : null}
      </div>
    </article>
  );
}
