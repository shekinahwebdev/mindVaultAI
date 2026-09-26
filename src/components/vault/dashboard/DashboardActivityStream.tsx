"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

import type { DashboardNotePreview } from "@/lib/vault/dashboard-queries";
import { vaultRoutes } from "@/lib/routes";
import { cn } from "@/lib/utils";

import { vaultActionShape } from "../vault-controls";

import { DashboardSectionHeader } from "./DashboardSectionHeader";
import { VaultStreamRow } from "./VaultStreamRow";
import { dashboardBentoCellClassName } from "./dashboard-ui";

type DashboardActivityStreamProps = {
  recentNotes: DashboardNotePreview[];
  recentlyEdited: DashboardNotePreview[];
  isEmpty: boolean;
  className?: string;
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

export function DashboardActivityStream({
  recentNotes,
  recentlyEdited,
  isEmpty,
  className,
}: DashboardActivityStreamProps) {
  return (
    <section
      className={cn(
        dashboardBentoCellClassName,
        "flex h-full max-h-[min(24rem,50vh)] min-h-[10rem] flex-col px-4 py-3.5 sm:px-5 sm:py-4",
        className,
      )}
    >
      <DashboardSectionHeader
        title="Activity"
        action={
          !isEmpty ? { label: "All notes", href: vaultRoutes.notes } : undefined
        }
      />

      {isEmpty ? (
        <div className="mt-4 flex flex-1 flex-col items-center justify-center rounded-[10px] border border-dashed border-border bg-mv-panel/30 px-4 py-8 text-center">
          <p className="text-[1.05rem] font-semibold text-foreground">
            Your vault is waiting.
          </p>
          <p className="mt-2 max-w-sm text-[0.8125rem] leading-relaxed text-muted-foreground">
            Capture your first thought, link, quote, or piece of knowledge.
          </p>
          <Link
            href={vaultRoutes.capture}
            className={cn(
              "mt-5 inline-flex h-9 items-center gap-2 px-3.5 text-[0.875rem] font-medium",
              vaultActionShape,
              "border border-border text-foreground/90 hover:border-foreground/25",
            )}
          >
            <Plus aria-hidden className="size-3.5" />
            Capture something
          </Link>
        </div>
      ) : (
        <div className="mt-2 min-h-0 flex-1 overflow-y-auto">
          <ul className="relative">
            {recentNotes.map((note) => (
              <li key={note.id}>
                <VaultStreamRow
                  note={note}
                  dateLabel={formatDate(note.createdAt)}
                  eventLabel="Added"
                />
              </li>
            ))}
          </ul>

          {recentlyEdited.length > 0 ? (
            <div className="mt-2 border-t border-border pt-2">
              <p className="px-1 pb-1 text-[0.6875rem] font-medium text-mv-faint">
                Recently edited
              </p>
              <ul>
                {recentlyEdited.map((note) => (
                  <li key={`edited-${note.id}`}>
                    <VaultStreamRow
                      note={note}
                      dateLabel={formatDate(note.updatedAt)}
                      eventLabel="Edited"
                    />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
