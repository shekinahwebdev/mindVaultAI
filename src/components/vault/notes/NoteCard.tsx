"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";

import type { SerializedNote } from "@/lib/notes/serialize";
import {
  formatNoteDate,
  noteDetailPath,
  noteTypeLabels,
  truncateNoteContent,
} from "@/lib/notes/note-display";
import { cn } from "@/lib/utils";

type NoteCardProps = {
  note: SerializedNote;
};

export function NoteCard({ note }: NoteCardProps) {
  const preview = truncateNoteContent(note.content);
  const typeLabel = noteTypeLabels[note.type] ?? note.type;
  const dateLabel = formatNoteDate(note.updatedAt);

  return (
    <Link
      href={noteDetailPath(note.id)}
      className="group block rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-3.5 transition-colors hover:border-white/[0.14] hover:bg-white/[0.04] sm:px-5 sm:py-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="min-w-0 flex-1 text-[0.95rem] leading-snug text-white/90 group-hover:text-brand-ink">
          {note.title}
        </h2>
        <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[0.62rem] tracking-[0.12em] text-white/45 uppercase">
          {typeLabel}
        </span>
      </div>

      {preview ? (
        <p className="mt-2 line-clamp-2 text-[0.82rem] leading-relaxed text-white/42">
          {preview}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.72rem] text-white/34">
        {note.category ? (
          <span className="rounded-full border border-white/10 px-2 py-0.5 text-white/52">
            {note.category.name}
          </span>
        ) : (
          <span className="text-white/28">Uncategorized</span>
        )}
        {note.sourceUrl ? (
          <span className="inline-flex items-center gap-1 text-white/38">
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
