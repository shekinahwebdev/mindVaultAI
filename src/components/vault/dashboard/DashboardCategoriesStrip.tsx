"use client";

import Link from "next/link";
import { FolderOpen } from "lucide-react";

import type { DashboardCategoryPreview } from "@/lib/vault/dashboard-queries";
import { vaultRoutes } from "@/lib/routes";
import { cn } from "@/lib/utils";

import { vaultMetaClassName } from "@/lib/vault/vault-typography";

import { dashboardBentoCellClassName } from "./dashboard-ui";

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
  return (
    <section
      className={cn(
        dashboardBentoCellClassName,
        "flex flex-col px-3 py-3 sm:px-4",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[0.8125rem] font-semibold text-foreground">Categories</h2>
        <Link
          href={vaultRoutes.categories}
          className={cn(vaultMetaClassName, "font-medium hover:text-foreground")}
        >
          View all
        </Link>
      </div>
      {categories.length === 0 ? (
        <p className="mt-2 text-[0.8125rem] text-muted-foreground">
          {isEmpty
            ? "Group saves into categories when you are ready."
            : "No categories yet."}
        </p>
      ) : (
        <ul className="mt-2.5 flex flex-wrap gap-2">
          {categories.map((category) => (
            <li key={category.id}>
              <Link
                href={vaultRoutes.categories}
                className="inline-flex items-center gap-2 rounded-[8px] border border-border bg-mv-panel/50 px-2.5 py-1.5 text-[0.8125rem] font-medium text-foreground transition-colors hover:bg-mv-panel"
              >
                <FolderOpen aria-hidden className="size-3.5 text-muted-foreground" />
                <span>{category.name}</span>
                <span className="tabular-nums text-mv-faint">{category.noteCount}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
