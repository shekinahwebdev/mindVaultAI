"use client";

import {
  Archive,
  Code2,
  FileText,
  Image,
  StickyNote,
} from "lucide-react";

import { mvContentCardClassName } from "@/lib/mv/layout-tokens";
import type { ArchivedVaultItem } from "@/lib/vault/archive-demo-data";
import { countArchiveOverview } from "@/lib/vault/archive-demo-data";
import { cn } from "@/lib/utils";

type ArchiveOverviewProps = {
  items: ArchivedVaultItem[];
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

export function ArchiveOverview({ items }: ArchiveOverviewProps) {
  const stats = countArchiveOverview(items);

  return (
    <section className={cn(mvContentCardClassName, "p-4 sm:p-5")}>
      <header className="flex items-center gap-2">
        <Archive aria-hidden className="size-4 text-muted-foreground" />
        <h2 className="text-[0.8125rem] font-semibold tracking-[-0.01em] text-foreground">
          Archive Overview
        </h2>
      </header>
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <StatBlock label="Archived Notes" value={stats.notes} icon={StickyNote} />
        <StatBlock label="Documents" value={stats.documents} icon={FileText} />
        <StatBlock label="Code Snippets" value={stats.code} icon={Code2} />
        <StatBlock label="Images & Files" value={stats.files} icon={Image} />
      </div>
      <p className="mt-3 text-[0.6875rem] text-mv-faint">
        {stats.total === 1 ? "1 item in archive" : `${stats.total} items in archive`}
      </p>
    </section>
  );
}
