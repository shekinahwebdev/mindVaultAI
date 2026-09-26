import Link from "next/link";
import { FolderOpen } from "lucide-react";

import type { DashboardCategoryPreview } from "@/lib/vault/dashboard-queries";
import { vaultRoutes } from "@/lib/routes";
import { cn } from "@/lib/utils";

import { DashboardSectionHeader } from "./DashboardSectionHeader";
import {
  dashboardPanelClassName,
  dashboardPanelPaddingClassName,
} from "./dashboard-ui";

type DashboardCategoriesProps = {
  categories: DashboardCategoryPreview[];
  isEmpty: boolean;
};

export function DashboardCategories({
  categories,
  isEmpty,
}: DashboardCategoriesProps) {
  return (
    <section
      className={cn(dashboardPanelClassName, dashboardPanelPaddingClassName)}
    >
      <DashboardSectionHeader
        title="Categories"
        action={{ label: "View all", href: vaultRoutes.categories }}
      />

      {categories.length === 0 ? (
        <p className="mt-3 text-[0.82rem] leading-relaxed text-muted-foreground">
          {isEmpty
            ? "Create categories when you're ready to group what you save."
            : "No categories yet. Organize your vault from the Categories page."}
        </p>
      ) : (
        <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
          {categories.map((category) => (
            <li key={category.id}>
              <Link
                href={vaultRoutes.categories}
                className={cn(
                  "flex items-center justify-between gap-2.5 rounded-[10px] border border-border bg-mv-panel/60 px-2.5 py-2",
                  "transition-[transform,background-color,border-color] duration-200",
                  "motion-safe:hover:-translate-y-px motion-safe:hover:border-foreground/12 motion-safe:hover:bg-mv-panel",
                )}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-[8px] border border-border bg-surface text-muted-foreground">
                    <FolderOpen aria-hidden className="size-3.5" />
                  </span>
                  <span className="truncate text-[0.82rem] font-medium text-foreground">
                    {category.name}
                  </span>
                </span>
                <span className="shrink-0 rounded-md border border-border bg-surface px-2 py-0.5 text-[0.68rem] tabular-nums text-muted-foreground">
                  {category.noteCount}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
