"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";

import type { SerializedNote } from "@/lib/notes/serialize";
import { NoteTagBadges } from "@/components/vault/tags/NoteTagBadges";
import {
  formatNoteDate,
  noteDetailPath,
  noteTypeLabels,
  truncateNoteContent,
} from "@/lib/notes/note-display";
import { cn } from "@/lib/utils";

import { vaultMetaClassName } from "../vault-controls";

type NoteCardProps = {
  note: SerializedNote;
  // Optional dev/testing affordance (e.g. a semantic-search match score).
  // Undefined by default, so existing callers render exactly as before.
  matchLabel?: string;
  showTags?: boolean;
};

export function NoteCard({ note, matchLabel, showTags }: NoteCardProps) {
  const preview = truncateNoteContent(note.content);
  const typeLabel = noteTypeLabels[note.type] ?? note.type;
  const dateLabel = formatNoteDate(note.updatedAt);

  return (
    <Link
      href={noteDetailPath(note.id)}
      className="group block rounded-xl border border-border bg-surface px-4 py-3.5 shadow-[0_1px_2px_rgb(0_0_0/0.03)] transition-colors hover:border-border sm:px-5 sm:py-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="min-w-0 flex-1 text-[0.95rem] leading-snug text-foreground group-hover:text-foreground">
          {note.title}
        </h2>
        <span className="flex shrink-0 items-center gap-1.5">
          {matchLabel ? (
            <span
              className={cn(
                "rounded-md border border-border bg-mv-panel px-2 py-0.5",
                vaultMetaClassName,
              )}
            >
              {matchLabel}
            </span>
          ) : null}
          <span
            className={cn(
              "rounded-md border border-border bg-mv-panel px-2 py-0.5 text-mv-faint",
              vaultMetaClassName,
            )}
          >
            {typeLabel}
          </span>
        </span>
      </div>

      {preview ? (
        <p className="mt-2 line-clamp-2 text-[0.82rem] leading-relaxed text-muted-foreground">
          {preview}
        </p>
      ) : null}

      {showTags && note.tags.length > 0 ? (
        <NoteTagBadges tags={note.tags} className="mt-2.5" />
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.72rem] text-mv-faint">
        {note.category ? (
          <span className="rounded-md border border-border px-2 py-0.5 text-muted-foreground">
            {note.category.name}
          </span>
        ) : (
          <span className="text-mv-faint">Uncategorized</span>
        )}
        {note.sourceUrl ? (
          <span className="inline-flex items-center gap-1 text-mv-faint">
            <ExternalLink aria-hidden className="size-3" />
            Source
          </span>
        ) : null}
        <span className={cn(note.sourceUrl || note.category ? "ml-auto" : "")}>
          Updated {dateLabel}
        </span>
      </div>
    </Link>
  );
}
