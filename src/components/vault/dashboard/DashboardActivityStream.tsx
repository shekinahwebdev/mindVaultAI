"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useMemo } from "react";

import { ContentCard } from "@/components/mv/ContentCard";
import { EmptyState } from "@/components/mv/EmptyState";
import type { DashboardNotePreview } from "@/lib/vault/dashboard-queries";
import { formatRelativeTime } from "@/lib/vault/format-relative-time";
import { vaultRoutes } from "@/lib/routes";
import { cn } from "@/lib/utils";

import { vaultActionShape } from "../vault-controls";

import { DashboardSectionHeader } from "./DashboardSectionHeader";
import { VaultItemRow } from "./VaultItemRow";

type DashboardActivityStreamProps = {
  recentNotes: DashboardNotePreview[];
  recentlyEdited: DashboardNotePreview[];
  isEmpty: boolean;
  className?: string;
};

function mergeRecentActivity(
  recentNotes: DashboardNotePreview[],
  recentlyEdited: DashboardNotePreview[],
): DashboardNotePreview[] {
  const seen = new Set<string>();
  const merged: DashboardNotePreview[] = [];

  for (const note of recentNotes) {
    if (seen.has(note.id)) continue;
    seen.add(note.id);
    merged.push(note);
  }

  for (const note of recentlyEdited) {
    if (seen.has(note.id)) continue;
    seen.add(note.id);
    merged.push(note);
  }

  return merged.slice(0, 8);
}

export function DashboardActivityStream({
  recentNotes,
  recentlyEdited,
  isEmpty,
  className,
}: DashboardActivityStreamProps) {
  const activityNotes = useMemo(
    () => mergeRecentActivity(recentNotes, recentlyEdited),
    [recentNotes, recentlyEdited],
  );

  return (
    <ContentCard
      padding="sm"
      className={cn("flex min-h-[18rem] flex-col lg:min-h-[24rem]", className)}
    >
      <DashboardSectionHeader
        title="Recent Notes"
        action={
          !isEmpty ? { label: "View all", href: vaultRoutes.notes } : undefined
        }
      />

      {isEmpty ? (
        <EmptyState
          variant="dashed"
          className="mt-3 flex-1 py-10 sm:py-12"
          title="Your vault is waiting."
          description="Capture your first thought, link, quote, or piece of knowledge."
          action={
            <Link
              href={vaultRoutes.capture}
              className={cn(
                "inline-flex h-9 items-center gap-2 px-3.5 text-[0.875rem] font-medium",
                vaultActionShape,
                "border border-border text-foreground/90 hover:border-foreground/25",
              )}
            >
              <Plus aria-hidden className="size-3.5" />
              Capture something
            </Link>
          }
        />
      ) : (
        <div className="mt-1 min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <ul className="space-y-0.5">
            {activityNotes.map((note) => (
              <li key={note.id}>
                <VaultItemRow
                  note={note}
                  dateLabel={formatRelativeTime(note.updatedAt)}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </ContentCard>
  );
}
