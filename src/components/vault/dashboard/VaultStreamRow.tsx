"use client";

import Link from "next/link";

import type { DashboardNotePreview } from "@/lib/vault/dashboard-queries";
import { noteDetailPath } from "@/lib/notes/note-display";
import { getNoteTypeLabel, NoteTypeIcon } from "@/lib/vault/note-type-ui";
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
  const typeLabel = getNoteTypeLabel(note.type);

  return (
    <Link
      href={noteDetailPath(note.id)}
      className={cn(
        "group flex gap-3 border-b border-border/70 py-3 pr-1 pl-0.5 last:border-b-0",
        "transition-colors hover:bg-mv-panel/40",
      )}
    >
      <NoteTypeIcon
        type={note.type}
        aria-hidden
        className="mt-0.5 size-4 shrink-0 stroke-[1.65] text-muted-foreground group-hover:text-foreground"
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-3">
          <span className="line-clamp-1 text-[0.9375rem] font-medium text-foreground">
            {note.title}
          </span>
          <time className="shrink-0 text-[0.75rem] tabular-nums text-mv-faint">{dateLabel}</time>
        </span>
        {note.preview ? (
          <span className="mt-0.5 line-clamp-2 text-[0.8125rem] leading-snug text-muted-foreground">
            {note.preview}
          </span>
        ) : null}
        <span className="mt-1.5 flex flex-wrap items-center gap-x-2 text-[0.75rem] text-mv-faint">
          <span>{eventLabel}</span>
          <span aria-hidden>·</span>
          <span>{typeLabel}</span>
          <span aria-hidden>·</span>
          <span className="truncate">{note.categoryName ?? "Uncategorized"}</span>
        </span>
      </span>
    </Link>
  );
}
