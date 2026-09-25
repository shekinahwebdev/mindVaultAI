"use client";

import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { DashboardNotePreview } from "@/lib/vault/dashboard-queries";
import { noteDetailPath } from "@/lib/notes/note-display";
import {
  getNoteTypeIcon,
  getNoteTypeLabel,
  noteTypePillClassName,
} from "@/lib/vault/note-type-ui";
import { cn } from "@/lib/utils";

import { vaultActionFocus } from "../vault-controls";

type VaultItemRowProps = {
  note: DashboardNotePreview;
  dateLabel: string;
};

export function VaultItemRow({ note, dateLabel }: VaultItemRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const TypeIcon = getNoteTypeIcon(note.type);
  const typeLabel = getNoteTypeLabel(note.type);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [menuOpen]);

  return (
    <div className="group relative rounded-[12px] transition-colors duration-200 hover:bg-mv-panel/80">
      <Link
        href={noteDetailPath(note.id)}
        className="flex gap-2.5 px-2 py-2.5 sm:px-2.5"
      >
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[8px] border border-border bg-surface text-muted-foreground transition-colors group-hover:text-foreground">
          <TypeIcon aria-hidden className="size-4 stroke-[1.65]" />
        </span>
        <span className="min-w-0 flex-1 pr-8">
          <span className="flex items-start justify-between gap-2">
            <span className="line-clamp-1 text-[0.88rem] font-medium text-foreground">
              {note.title}
            </span>
            <span className={noteTypePillClassName(note.type)}>{typeLabel}</span>
          </span>
          {note.preview ? (
            <span className="mt-0.5 line-clamp-2 text-[0.8rem] leading-snug text-muted-foreground">
              {note.preview}
            </span>
          ) : null}
          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.72rem] text-mv-faint">
            <span className="max-w-[14rem] truncate text-muted-foreground">
              {note.categoryName ?? "Uncategorized"}
            </span>
            <span aria-hidden>·</span>
            <span>{dateLabel}</span>
          </span>
        </span>
      </Link>

      <div ref={menuRef} className="absolute top-2.5 right-2 sm:right-3">
        <button
          type="button"
          aria-label={`Actions for ${note.title}`}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setMenuOpen((open) => !open);
          }}
          className={cn(
            "flex size-8 items-center justify-center rounded-[8px] text-mv-faint opacity-0 transition-all duration-200 group-hover:opacity-100 focus-visible:opacity-100",
            "hover:bg-surface hover:text-foreground",
            vaultActionFocus,
            menuOpen && "opacity-100 bg-surface text-foreground",
          )}
        >
          <MoreHorizontal aria-hidden className="size-4" />
        </button>
        {menuOpen ? (
          <div
            role="menu"
            className="absolute top-[calc(100%+4px)] right-0 z-10 min-w-[9rem] rounded-[10px] border border-border bg-surface p-1 shadow-[0_12px_32px_rgb(0_0_0/0.12)]"
          >
            <Link
              role="menuitem"
              href={noteDetailPath(note.id)}
              className="block rounded-[8px] px-2.5 py-2 text-[0.82rem] text-foreground transition-colors hover:bg-mv-panel"
              onClick={() => setMenuOpen(false)}
            >
              Open
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
