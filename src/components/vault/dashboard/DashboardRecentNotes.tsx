"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

import type { DashboardNotePreview } from "@/lib/vault/dashboard-queries";
import { vaultRoutes } from "@/lib/routes";
import { cn } from "@/lib/utils";

import { vaultActionShape } from "../vault-controls";

import { DashboardSectionHeader } from "./DashboardSectionHeader";
import { VaultItemRow } from "./VaultItemRow";
import {
  dashboardPanelClassName,
  dashboardPanelPaddingClassName,
} from "./dashboard-ui";

type DashboardRecentNotesProps = {
  recentNotes: DashboardNotePreview[];
  recentlyEdited: DashboardNotePreview[];
  isEmpty: boolean;
};

function NoteActivityList({
  notes,
  dateFor,
}: {
  notes: DashboardNotePreview[];
  dateFor: (note: DashboardNotePreview) => string;
}) {
  return (
    <ul className="space-y-0.5">
      {notes.map((note) => (
        <li key={note.id}>
          <VaultItemRow note={note} dateLabel={dateFor(note)} />
        </li>
      ))}
    </ul>
  );
}

export function DashboardRecentNotes({
  recentNotes,
  recentlyEdited,
  isEmpty,
}: DashboardRecentNotesProps) {
  return (
    <section
      className={cn(dashboardPanelClassName, dashboardPanelPaddingClassName)}
    >
      <DashboardSectionHeader
        title="Recent vault items"
        action={
          !isEmpty
            ? { label: "View all notes", href: vaultRoutes.notes }
            : undefined
        }
      />

      {isEmpty ? (
        <div className="mt-3 flex min-h-[10rem] flex-col items-center justify-center rounded-[12px] border border-dashed border-border bg-mv-panel px-4 py-6 text-center">
          <p className="text-[1.15rem] font-semibold text-foreground sm:text-[1.25rem]">
            Your vault is waiting.
          </p>
          <p className="mt-2 max-w-sm text-[0.84rem] leading-relaxed text-muted-foreground">
            Capture your first thought, link, quote, or piece of knowledge.
          </p>
          <Link
            href={vaultRoutes.capture}
            className={cn(
              "mt-5 inline-flex min-h-10 items-center gap-2 border border-border px-3.5 py-2 text-[0.84rem] font-medium text-foreground/85 transition-colors duration-200 hover:border-foreground/25 hover:text-foreground",
              vaultActionShape,
            )}
          >
            <Plus aria-hidden className="size-3.5" />
            Capture something
          </Link>
        </div>
      ) : (
        <div className="mt-3">
          <NoteActivityList
            notes={recentNotes}
            dateFor={(note) =>
              new Intl.DateTimeFormat("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }).format(new Date(note.createdAt))
            }
          />

          {recentlyEdited.length > 0 ? (
            <div className="mt-3 border-t border-border pt-3">
              <h3 className="px-2 text-[0.75rem] font-medium text-muted-foreground sm:px-3">
                Recently edited
              </h3>
              <div className="mt-1.5">
                <NoteActivityList
                  notes={recentlyEdited}
                  dateFor={(note) =>
                    new Intl.DateTimeFormat("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }).format(new Date(note.updatedAt))
                  }
                />
              </div>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
