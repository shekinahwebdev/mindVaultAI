"use client";

import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { SerializedNote } from "@/lib/notes/serialize";
import { noteDetailPath } from "@/lib/notes/note-display";
import { getNoteTypeLabel, NoteTypeIcon } from "@/lib/vault/note-type-ui";
import { formatRelativeTime } from "@/lib/vault/format-relative-time";
import { cn } from "@/lib/utils";

import { vaultActionFocus } from "../vault-controls";

type NotesTableRowProps = {
  note: SerializedNote;
};

export function NotesTableRow({ note }: NotesTableRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const typeLabel = getNoteTypeLabel(note.type);
  const categoryLabel = note.category?.name ?? "—";
  const updatedLabel = formatRelativeTime(note.updatedAt);

  useEffect(() => {
    if (!menuOpen) return;

    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [menuOpen]);

  return (
    <tr className="group border-b border-border/70 last:border-b-0 hover:bg-mv-panel/40">
      <td className="w-10 px-3 py-3 align-middle">
        <span
          aria-hidden
          className="inline-block size-4 rounded-[4px] border border-border bg-surface"
        />
      </td>
      <td className="min-w-0 px-2 py-3 align-middle">
        <Link
          href={noteDetailPath(note.id)}
          className="flex min-w-0 items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-[var(--mv-radius-control)] border border-border bg-mv-panel text-muted-foreground">
            <NoteTypeIcon
              type={note.type}
              aria-hidden
              className="size-4 stroke-[1.65]"
            />
          </span>
          <span className="line-clamp-1 text-[0.875rem] font-medium text-foreground">
            {note.title}
          </span>
        </Link>
      </td>
      <td className="hidden w-[8.5rem] px-2 py-3 align-middle text-[0.8125rem] text-muted-foreground sm:table-cell">
        <span className="line-clamp-1">{categoryLabel}</span>
      </td>
      <td className="hidden w-[5.5rem] px-2 py-3 align-middle text-[0.8125rem] text-muted-foreground md:table-cell">
        {typeLabel}
      </td>
      <td className="w-[5.5rem] px-2 py-3 align-middle text-[0.8125rem] tabular-nums text-muted-foreground whitespace-nowrap">
        {updatedLabel}
      </td>
      <td className="relative w-10 px-2 py-3 align-middle">
        <div ref={menuRef} className="flex justify-end">
          <button
            type="button"
            aria-label={`Actions for ${note.title}`}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onClick={() => setMenuOpen((open) => !open)}
            className={cn(
              "flex size-8 items-center justify-center rounded-[var(--mv-radius-control)] text-mv-faint opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100",
              "hover:bg-mv-panel hover:text-foreground",
              vaultActionFocus,
              menuOpen && "opacity-100 bg-mv-panel text-foreground",
            )}
          >
            <MoreHorizontal aria-hidden className="size-4" />
          </button>
          {menuOpen ? (
            <div
              role="menu"
              className="absolute top-full right-2 z-20 mt-1 min-w-[9rem] rounded-[var(--mv-radius-control)] border border-border bg-surface p-1 shadow-[var(--mv-shadow-elevated)]"
            >
              <Link
                role="menuitem"
                href={noteDetailPath(note.id)}
                className="block rounded-[6px] px-2.5 py-2 text-[0.8125rem] text-foreground hover:bg-mv-panel"
                onClick={() => setMenuOpen(false)}
              >
                Open
              </Link>
            </div>
          ) : null}
        </div>
      </td>
    </tr>
  );
}
