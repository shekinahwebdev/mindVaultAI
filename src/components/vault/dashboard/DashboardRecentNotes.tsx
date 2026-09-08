"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

import type {
  DashboardNotePreview,
} from "@/lib/vault/dashboard-queries";
import {
  formatNoteDate,
  noteDetailPath,
  noteTypeLabels,
} from "@/lib/notes/note-display";
import { vaultRoutes } from "@/lib/routes";

type DashboardRecentNotesProps = {
  recentNotes: DashboardNotePreview[];
  recentlyEdited: DashboardNotePreview[];
  isEmpty: boolean;
};

function NotePreviewRow({
  note,
  dateLabel,
}: {
  note: DashboardNotePreview;
  dateLabel: string;
}) {
  const typeLabel = noteTypeLabels[note.type] ?? note.type;

  return (
    <Link
      href={noteDetailPath(note.id)}
      className="block rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3 transition-colors hover:border-white/[0.12] hover:bg-white/[0.04]"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 flex-1 text-[0.88rem] text-white/86">{note.title}</p>
        <span className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-[0.58rem] tracking-[0.1em] text-white/40 uppercase">
          {typeLabel}
        </span>
      </div>
      {note.preview ? (
        <p className="mt-1.5 line-clamp-1 text-[0.78rem] text-white/38">
          {note.preview}
        </p>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.72rem] text-white/32">
        {note.categoryName ? (
          <span className="text-white/46">{note.categoryName}</span>
        ) : (
          <span>Uncategorized</span>
        )}
        <span aria-hidden>·</span>
        <span>{dateLabel}</span>
      </div>
    </Link>
  );
}

export function DashboardRecentNotes({
  recentNotes,
  recentlyEdited,
  isEmpty,
}: DashboardRecentNotesProps) {
  return (
    <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 shadow-[0_12px_32px_rgba(0,0,0,0.2)] sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[0.92rem] text-white/88">Recent Notes</h2>
        {!isEmpty ? (
          <Link
            href={vaultRoutes.notes}
            className="text-[0.68rem] tracking-[0.12em] text-white/40 uppercase transition-colors hover:text-white/62"
          >
            View all notes
          </Link>
        ) : null}
      </div>

      {isEmpty ? (
        <div className="mt-8 flex min-h-[14rem] flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.1] bg-black/10 px-6 py-10 text-center">
          <p className="font-editorial text-[1.2rem] text-brand-ink italic sm:text-[1.35rem]">
            Your vault is waiting.
          </p>
          <p className="mt-2 max-w-sm text-[0.86rem] leading-relaxed text-white/42">
            Capture your first thought, link, quote, or piece of knowledge.
          </p>
          <Link
            href={vaultRoutes.capture}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/16 px-4 py-2 text-[0.74rem] tracking-[0.14em] text-white/72 uppercase transition-colors hover:border-white/24 hover:text-white/88"
          >
            <Plus aria-hidden className="size-3.5" />
            Capture something
          </Link>
        </div>
      ) : (
        <div className="mt-4 space-y-5">
          <ul className="space-y-2">
            {recentNotes.map((note) => (
              <li key={note.id}>
                <NotePreviewRow
                  note={note}
                  dateLabel={`Created ${formatNoteDate(note.createdAt)}`}
                />
              </li>
            ))}
          </ul>

          {recentlyEdited.length > 0 ? (
            <div className="border-t border-white/[0.06] pt-4">
              <h3 className="text-[0.78rem] tracking-[0.1em] text-white/42 uppercase">
                Recently Edited
              </h3>
              <ul className="mt-3 space-y-2">
                {recentlyEdited.map((note) => (
                  <li key={`edited-${note.id}`}>
                    <NotePreviewRow
                      note={note}
                      dateLabel={`Updated ${formatNoteDate(note.updatedAt)}`}
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
