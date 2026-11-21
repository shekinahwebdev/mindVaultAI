"use client";

import Link from "next/link";

import { ContentCard } from "@/components/mv/ContentCard";
import type { DashboardCollectionPreview } from "@/lib/vault/dashboard-queries";
import { vaultRoutes } from "@/lib/routes";
import { cn } from "@/lib/utils";

import { DashboardSectionHeader } from "./DashboardSectionHeader";

type DashboardCollectionsStripProps = {
  collections: DashboardCollectionPreview[];
  className?: string;
};

export function DashboardCollectionsStrip({
  collections,
  className,
}: DashboardCollectionsStripProps) {
  if (collections.length === 0) {
    return null;
  }

  return (
    <ContentCard
      padding="sm"
      variant="muted"
      className={cn("min-h-0", className)}
    >
      <DashboardSectionHeader
        title="Collections"
        action={{ label: "Library", href: vaultRoutes.library }}
      />
      <ul className="mt-2 space-y-1">
        {collections.map((collection) => (
          <li key={collection.id}>
            <Link
              href={vaultRoutes.library}
              className="flex items-center justify-between gap-2 rounded-[var(--mv-radius-control)] px-1 py-1.5 text-[0.8125rem] transition-colors hover:bg-mv-panel/50"
            >
              <span className="truncate font-medium text-foreground">
                {collection.name}
              </span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {collection.itemCount}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </ContentCard>
  );
}