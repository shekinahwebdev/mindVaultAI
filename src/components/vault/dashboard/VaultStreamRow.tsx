"use client";

import Link from "next/link";

import type { DashboardNotePreview } from "@/lib/vault/dashboard-queries";
import { noteDetailPath } from "@/lib/notes/note-display";
import {
  getNoteTypeIcon,
  getNoteTypeLabel,
} from "@/lib/vault/note-type-ui";
import { cn } from "@/lib/utils";

type VaultStreamRowProps = {
  note: DashboardNotePreview;
  dateLabel: string;
  eventLabel?: string;
};

export function VaultStreamRow({
  note,
  dateLabel,
  eventLabel = "Added",
}: VaultStreamRowProps) {
  const TypeIcon = getNoteTypeIcon(note.type);
  const typeLabel = getNoteTypeLabel(note.type);

  return (
    <Link
      href={noteDetailPath(note.id)}
      className={cn(
        "group grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 py-3 pl-1 pr-2",
        "border-b border-border/50 last:border-b-0",
        "transition-colors hover:bg-mv-panel/50",
      )}
    >
      <span className="flex flex-col items-center gap-1 pt-1.5">
        <span
          aria-hidden
          className="size-2 shrink-0 rounded-full bg-muted-foreground/70 ring-2 ring-surface transition-colors group-hover:bg-foreground"
        />
      </span>
      <span className="min-w-0">
        <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-[0.6875rem] font-medium text-mv-faint">
            {eventLabel}
          </span>
          <span className="text-[0.6875rem] text-mv-faint">{dateLabel}</span>
        </span>
        <span className="mt-1 flex items-start gap-2.5">
          <TypeIcon
            aria-hidden
            className="mt-0.5 size-4 shrink-0 stroke-[1.65] text-muted-foreground group-hover:text-foreground"
          />
          <span className="min-w-0 flex-1">
            <span className="line-clamp-1 text-[0.9rem] font-medium text-foreground">
              {note.title}
            </span>
            {note.preview ? (
              <span className="mt-0.5 line-clamp-1 text-[0.8125rem] text-muted-foreground">
                {note.preview}
              </span>
            ) : null}
            <span className="mt-1 flex flex-wrap items-center gap-x-2 text-[0.75rem] text-mv-faint">
              <span>{typeLabel}</span>
              <span aria-hidden>·</span>
              <span>{note.categoryName ?? "Uncategorized"}</span>
            </span>
          </span>
        </span>
      </span>
    </Link>
  );
}
