"use client";

import Link from "next/link";
import { useMemo } from "react";

import { ContentCard } from "@/components/mv/ContentCard";
import type { DashboardCategoryPreview } from "@/lib/vault/dashboard-queries";
import { vaultRoutes } from "@/lib/routes";
import { cn } from "@/lib/utils";

import { DashboardSectionHeader } from "./DashboardSectionHeader";

type DashboardCategoriesStripProps = {
  categories: DashboardCategoryPreview[];
  isEmpty: boolean;
  className?: string;
};

export function DashboardCategoriesStrip({
  categories,
  isEmpty,
  className,
}: DashboardCategoriesStripProps) {
  const topCategories = useMemo(
    () => [...categories].sort((a, b) => b.noteCount - a.noteCount),
    [categories],
  );

  const maxCount = useMemo(
    () => Math.max(1, ...topCategories.map((category) => category.noteCount)),
    [topCategories],
  );

  return (
    <ContentCard padding="sm" variant="muted" className={cn("min-h-0", className)}>
      <DashboardSectionHeader
        title="Top Categories"
        action={{ label: "View all", href: vaultRoutes.categories }}
      />

      {topCategories.length === 0 ? (
        <p className="mt-2 text-[0.8125rem] leading-relaxed text-muted-foreground">
          {isEmpty
            ? "Group saves into categories when you are ready."
            : "No categories yet."}
        </p>
      ) : (
        <ul className="mt-2 space-y-3">
          {topCategories.map((category) => {
            const widthPct = Math.round((category.noteCount / maxCount) * 100);

            return (
              <li key={category.id}>
                <Link
                  href={vaultRoutes.categories}
                  className="group block rounded-[var(--mv-radius-control)] transition-colors hover:bg-mv-panel/50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        aria-hidden
                        className="size-2 shrink-0 rounded-[3px] bg-foreground/25"
                      />
                      <span className="truncate text-[0.8125rem] font-medium text-foreground">
                        {category.name}
                      </span>
                    </span>
                    <span className="shrink-0 text-[0.8125rem] tabular-nums text-muted-foreground">
                      {category.noteCount}
                    </span>
                  </div>
                  <div
                    className="mt-1.5 h-1 overflow-hidden rounded-full bg-border/80"
                    role="presentation"
                  >
                    <div
                      className="h-full rounded-full bg-foreground/20 transition-[width] duration-300 group-hover:bg-foreground/30"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </ContentCard>
  );
}