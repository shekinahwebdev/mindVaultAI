"use client";

import {
  Archive,
  Code2,
  FileText,
  Link2,
  StickyNote,
} from "lucide-react";

import { mvContentCardClassName } from "@/lib/mv/layout-tokens";
import type { ArchiveOverviewStats } from "@/lib/notes/archive-types";
import { cn } from "@/lib/utils";

type ArchiveOverviewProps = {
  stats: ArchiveOverviewStats;
  loading?: boolean;
};

function StatBlock({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Archive;
}) {
  return (
    <div className="rounded-[var(--mv-radius-control)] border border-border bg-mv-panel/40 px-3 py-2.5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon aria-hidden className="size-3.5 shrink-0" />
        <span className="text-[0.6875rem] font-medium">{label}</span>
      </div>
      <p className="mt-1 text-[1.125rem] font-semibold tabular-nums tracking-[-0.02em] text-foreground">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

export function ArchiveOverview({ stats, loading }: ArchiveOverviewProps) {
  return (
    <section className={cn(mvContentCardClassName, "p-4 sm:p-5")}>
      <header className="flex items-center gap-2">
        <Archive aria-hidden className="size-4 text-muted-foreground" />
        <h2 className="text-[0.8125rem] font-semibold tracking-[-0.01em] text-foreground">
          Archive Overview
        </h2>
      </header>
      <div
        className={cn(
          "mt-4 grid grid-cols-2 gap-2.5",
          loading && "animate-pulse opacity-60",
        )}
      >
        <StatBlock label="Notes & quotes" value={stats.noteCount} icon={StickyNote} />
        <StatBlock label="Code snippets" value={stats.codeCount} icon={Code2} />
        <StatBlock label="Links" value={stats.linkCount} icon={Link2} />
        <StatBlock label="Articles" value={stats.articleCount} icon={FileText} />
      </div>
      <p className="mt-3 text-[0.6875rem] text-mv-faint">
        {loading
          ? "Loading archive…"
          : stats.total === 1
            ? "1 item in archive"
            : `${stats.total} items in archive`}
      </p>
    </section>
  );
}
