"use client";

import { MoreHorizontal, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { formatNoteDate } from "@/lib/notes/note-display";
import type { ArchivedVaultItem } from "@/lib/vault/archive-demo-data";
import { getNoteTypeLabel, NoteTypeIcon } from "@/lib/vault/note-type-ui";
import { cn } from "@/lib/utils";

import { vaultActionFocus, vaultSecondaryButton } from "../vault-controls";

type ArchiveGridCardProps = {
  item: ArchivedVaultItem;
  onRestore: (item: ArchivedVaultItem) => void;
};

export function ArchiveGridCard({ item, onRestore }: ArchiveGridCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [menuOpen]);

  return (
    <li>
      <article className="flex h-full flex-col rounded-[var(--mv-radius-card)] border border-border bg-surface p-4 shadow-[var(--mv-shadow-card)]">
        <div className="flex items-start justify-between gap-2">
          <span className="flex size-9 items-center justify-center rounded-[var(--mv-radius-control)] border border-border bg-mv-panel text-muted-foreground">
            <NoteTypeIcon type={item.type} aria-hidden className="size-4" />
          </span>
          <div ref={menuRef} className="relative">
            <button
              type="button"
              aria-label={`More actions for ${item.title}`}
              onClick={() => setMenuOpen((open) => !open)}
              className={cn(
                "flex size-8 items-center justify-center rounded-[var(--mv-radius-control)] text-mv-faint hover:bg-mv-panel hover:text-foreground",
                vaultActionFocus,
              )}
            >
              <MoreHorizontal aria-hidden className="size-4" />
            </button>
            {menuOpen ? (
              <div
                role="menu"
                className="absolute top-full right-0 z-20 mt-1 min-w-[9rem] rounded-[var(--mv-radius-control)] border border-border bg-surface p-1 shadow-[var(--mv-shadow-elevated)]"
              >
                <button
                  type="button"
                  role="menuitem"
                  className="block w-full rounded-[6px] px-2.5 py-2 text-left text-[0.8125rem] hover:bg-mv-panel"
                  onClick={() => {
                    setMenuOpen(false);
                    onRestore(item);
                  }}
                >
                  Restore
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-3 min-w-0 flex-1">
          <h2 className="line-clamp-2 text-[0.9375rem] font-semibold text-foreground">
            {item.title}
          </h2>
          <p className="mt-1 line-clamp-2 text-[0.75rem] text-muted-foreground">
            {item.description}
          </p>
          <p className="mt-2 text-[0.75rem] text-mv-faint">
            {getNoteTypeLabel(item.type)} · {item.category}
          </p>
          <p className="mt-1 text-[0.75rem] tabular-nums text-muted-foreground">
            Archived {formatNoteDate(item.archivedAt)}
          </p>
          {item.tags.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {item.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border bg-mv-panel px-2 py-0.5 text-[0.6875rem] text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => onRestore(item)}
          className={cn(vaultSecondaryButton, "mt-4 w-full gap-1.5 text-[0.8125rem]")}
        >
          <RotateCcw aria-hidden className="size-3.5" />
          Restore
        </button>
      </article>
    </li>
  );
}
