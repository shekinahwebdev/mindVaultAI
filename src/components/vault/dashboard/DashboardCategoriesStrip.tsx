"use client";

import Link from "next/link";
import { useMemo } from "react";

import { ContentCard } from "@/components/mv/ContentCard";
import type { DashboardCategoryPreview } from "@/lib/vault/dashboard-queries";
import { vaultRoutes } from "@/lib/routes";
import { cn } from "@/lib/utils";

import { DashboardSectionHeader } from "./DashboardSectionHeader";

const CATEGORY_ACCENT = [
  "bg-sky-500/20 text-sky-700 dark:text-sky-300",
  "bg-violet-500/20 text-violet-700 dark:text-violet-300",
  "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300",
  "bg-amber-500/20 text-amber-800 dark:text-amber-300",
  "bg-rose-500/20 text-rose-700 dark:text-rose-300",
  "bg-cyan-500/20 text-cyan-800 dark:text-cyan-300",
] as const;

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
    <ContentCard
      padding="sm"
      variant="muted"
      className={cn("flex min-h-0 flex-col lg:min-h-[24rem]", className)}
    >
      <DashboardSectionHeader
        title="Top Categories"
        action={{ label: "View all", href: vaultRoutes.categories }}
      />

      {topCategories.length === 0 ? (
        <p className="mt-3 text-[0.8125rem] leading-relaxed text-muted-foreground">
          {isEmpty
            ? "Group saves into categories when you are ready."
            : "No categories yet."}
        </p>
      ) : (
        <ul className="mt-3 space-y-4">
          {topCategories.map((category, index) => {
            const widthPct = Math.round((category.noteCount / maxCount) * 100);
            const accent = CATEGORY_ACCENT[index % CATEGORY_ACCENT.length];

            return (
              <li key={category.id}>
                <Link
                  href={vaultRoutes.categories}
                  className="group block rounded-[var(--mv-radius-control)] transition-colors hover:bg-mv-panel/50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span
                        aria-hidden
                        className={cn(
                          "size-2.5 shrink-0 rounded-[3px]",
                          accent.split(" ")[0],
                        )}
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
                    className="mt-2 h-1.5 overflow-hidden rounded-full bg-border/80"
                    role="presentation"
                  >
                    <div
                      className="h-full rounded-full bg-foreground/25 transition-[width] duration-300 group-hover:bg-foreground/35"
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
