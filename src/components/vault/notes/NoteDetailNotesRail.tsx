"use client";

import { Filter, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { SerializedNote } from "@/lib/notes/serialize";
import { noteDetailPath, truncateNoteContent } from "@/lib/notes/note-display";
import { useNotesList } from "@/lib/notes/use-notes-list";
import { vaultRoutes } from "@/lib/routes";
import { formatRelativeTime } from "@/lib/vault/format-relative-time";
import { NoteTypeIcon } from "@/lib/vault/note-type-ui";
import { cn } from "@/lib/utils";

type TypeFilter = "" | "NOTE" | "ARTICLE" | "LINK";

const TYPE_TABS: Array<{ value: TypeFilter; label: string }> = [
  { value: "", label: "All" },
  { value: "NOTE", label: "Notes" },
  { value: "ARTICLE", label: "Documents" },
  { value: "LINK", label: "Links" },
];

type NoteDetailNotesRailProps = {
  activeNoteId: string;
};

export function NoteDetailNotesRail({ activeNoteId }: NoteDetailNotesRailProps) {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("");

  const { notes, loading } = useNotesList({
    typeFilter,
    categoryFilter: "",
    sort: "updated_desc",
    searchQuery,
    page: 1,
  });

  useEffect(() => {
    const timer = window.setTimeout(() => setSearchQuery(searchInput), 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const grouped = useMemo(() => groupNotesByRecency(notes), [notes]);

  return (
    <aside className="hidden h-full min-h-0 w-[17rem] shrink-0 flex-col border-r border-border bg-surface lg:flex xl:w-[18.5rem]">
      <div className="space-y-3 border-b border-border p-3">
        <div className="flex gap-2">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search notes</span>
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-mv-faint"
            />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search..."
              className="h-9 w-full rounded-[var(--mv-radius-control)] border border-border bg-mv-panel py-2 pr-2 pl-8 text-[0.8125rem] outline-none placeholder:text-mv-faint"
            />
          </label>
          <Link
            href={vaultRoutes.capture}
            aria-label="New note"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-[var(--mv-radius-control)] bg-primary text-primary-foreground"
          >
            <Plus aria-hidden className="size-4" />
          </Link>
        </div>

        <div className="flex items-center justify-between gap-2">
          <Link
            href={vaultRoutes.notes}
            className="text-[0.8125rem] font-semibold text-foreground hover:underline"
          >
            All Notes
          </Link>
          <Filter aria-hidden className="size-3.5 text-mv-faint" />
        </div>

        <div className="flex flex-wrap gap-1">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.label}
              type="button"
              onClick={() => setTypeFilter(tab.value)}
              className={cn(
                "rounded-full border px-2 py-0.5 text-[0.6875rem] font-medium transition-colors",
                typeFilter === tab.value
                  ? "border-foreground/20 bg-mv-panel text-foreground"
                  : "border-transparent text-muted-foreground hover:bg-mv-panel/70",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {loading ? (
          <p className="px-2 py-6 text-[0.8125rem] text-muted-foreground">Loading…</p>
        ) : (
          <>
            {grouped.today.length > 0 ? (
              <NoteGroup title="Today" notes={grouped.today} activeNoteId={activeNoteId} />
            ) : null}
            {grouped.yesterday.length > 0 ? (
              <NoteGroup title="Yesterday" notes={grouped.yesterday} activeNoteId={activeNoteId} />
            ) : null}
            {grouped.older.length > 0 ? (
              <NoteGroup title="Earlier" notes={grouped.older} activeNoteId={activeNoteId} />
            ) : null}
          </>
        )}
      </div>
    </aside>
  );
}

function NoteGroup({
  title,
  notes,
  activeNoteId,
}: {
  title: string;
  notes: SerializedNote[];
  activeNoteId: string;
}) {
  return (
    <section className="mb-3">
      <h2 className="px-2 pb-1 text-[0.6875rem] font-semibold tracking-[0.06em] text-mv-faint uppercase">
        {title}
      </h2>
      <ul className="space-y-1">
        {notes.map((note) => (
          <NoteRailCard key={note.id} note={note} active={note.id === activeNoteId} />
        ))}
      </ul>
    </section>
  );
}

function NoteRailCard({ note, active }: { note: SerializedNote; active: boolean }) {
  return (
    <li>
      <Link
        href={noteDetailPath(note.id)}
        className={cn(
          "block rounded-[var(--mv-radius-control)] border px-2.5 py-2.5 transition-colors",
          active
            ? "border-foreground/15 bg-mv-panel"
            : "border-transparent hover:border-border hover:bg-mv-panel/50",
        )}
      >
        <div className="flex items-start gap-2">
          <NoteTypeIcon
            type={note.type}
            aria-hidden
            className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
          />
          <div className="min-w-0 flex-1">
            <p className="line-clamp-1 text-[0.8125rem] font-medium text-foreground">{note.title}</p>
            <p className="mt-0.5 line-clamp-2 text-[0.6875rem] leading-snug text-muted-foreground">
              {truncateNoteContent(note.content, 90)}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[0.625rem] text-mv-faint">
              <span>{formatRelativeTime(note.updatedAt)}</span>
              {note.category ? (
                <span className="rounded-full border border-border px-1.5 py-0.5 text-muted-foreground">
                  {note.category.name}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </Link>
    </li>
  );
}

function groupNotesByRecency(notes: SerializedNote[]) {
  const today: SerializedNote[] = [];
  const yesterday: SerializedNote[] = [];
  const older: SerializedNote[] = [];
  const now = new Date();

  for (const note of notes) {
    const date = new Date(note.updatedAt);
    if (Number.isNaN(date.getTime())) {
      older.push(note);
      continue;
    }
    if (date.toDateString() === now.toDateString()) {
      today.push(note);
    } else {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      if (date.toDateString() === y.toDateString()) {
        yesterday.push(note);
      } else {
        older.push(note);
      }
    }
  }

  return { today, yesterday, older };
}
