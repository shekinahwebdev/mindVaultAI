"use client";

import { MoreHorizontal, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { formatNoteDate } from "@/lib/notes/note-display";
import type { ArchivedVaultItem } from "@/lib/vault/archive-demo-data";
import { getNoteTypeLabel, NoteTypeIcon } from "@/lib/vault/note-type-ui";
import { toastInfo } from "@/lib/vault-toast";
import { cn } from "@/lib/utils";

import { vaultActionFocus, vaultSecondaryButton } from "../vault-controls";

type ArchiveTableRowProps = {
  item: ArchivedVaultItem;
  onRestore: (item: ArchivedVaultItem) => void;
};

export function ArchiveTableRow({ item, onRestore }: ArchiveTableRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const typeLabel = getNoteTypeLabel(item.type);
  const archivedLabel = formatNoteDate(item.archivedAt);

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
      <td className="min-w-[12rem] px-2 py-3 align-middle">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-[var(--mv-radius-control)] border border-border bg-mv-panel text-muted-foreground">
            <NoteTypeIcon
              type={item.type}
              aria-hidden
              className="size-4 stroke-[1.65]"
            />
          </span>
          <div className="min-w-0">
            <p className="line-clamp-1 text-[0.875rem] font-medium text-foreground">
              {item.title}
            </p>
            <p className="mt-0.5 line-clamp-1 text-[0.75rem] text-muted-foreground">
              {item.description}
            </p>
          </div>
        </div>
      </td>
      <td className="hidden w-[6.5rem] px-2 py-3 align-middle text-[0.8125rem] text-muted-foreground md:table-cell">
        <span className="inline-flex items-center gap-1.5">
          <NoteTypeIcon
            type={item.type}
            aria-hidden
            className="size-3.5 opacity-70"
          />
          {typeLabel}
        </span>
      </td>
      <td className="hidden w-[7rem] px-2 py-3 align-middle text-[0.8125rem] text-muted-foreground lg:table-cell">
        <span className="line-clamp-1">{item.category}</span>
      </td>
      <td className="hidden min-w-[8rem] px-2 py-3 align-middle xl:table-cell">
        <div className="flex flex-wrap gap-1">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex rounded-full border border-border bg-mv-panel px-2 py-0.5 text-[0.6875rem] text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      </td>
      <td className="w-[6.5rem] px-2 py-3 align-middle text-[0.8125rem] tabular-nums whitespace-nowrap text-muted-foreground">
        {archivedLabel}
      </td>
      <td className="w-[9.5rem] px-2 py-3 align-middle">
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => onRestore(item)}
            className={cn(
              vaultSecondaryButton,
              "h-8 gap-1.5 px-2.5 text-[0.75rem] opacity-100 sm:opacity-90 sm:group-hover:opacity-100",
            )}
          >
            <RotateCcw aria-hidden className="size-3.5" />
            Restore
          </button>
          <div ref={menuRef} className="relative">
            <button
              type="button"
              aria-label={`More actions for ${item.title}`}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              onClick={() => setMenuOpen((open) => !open)}
              className={cn(
                "flex size-8 items-center justify-center rounded-[var(--mv-radius-control)] border border-border bg-surface text-mv-faint",
                "hover:bg-mv-panel hover:text-foreground",
                vaultActionFocus,
                menuOpen && "bg-mv-panel text-foreground",
              )}
            >
              <MoreHorizontal aria-hidden className="size-4" />
            </button>
            {menuOpen ? (
              <div
                role="menu"
                className="absolute top-full right-0 z-20 mt-1 min-w-[10rem] rounded-[var(--mv-radius-control)] border border-border bg-surface p-1 shadow-[var(--mv-shadow-elevated)]"
              >
                <button
                  type="button"
                  role="menuitem"
                  className="block w-full rounded-[6px] px-2.5 py-2 text-left text-[0.8125rem] text-foreground hover:bg-mv-panel"
                  onClick={() => {
                    setMenuOpen(false);
                    onRestore(item);
                  }}
                >
                  Restore to vault
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="block w-full rounded-[6px] px-2.5 py-2 text-left text-[0.8125rem] text-red-600 hover:bg-red-500/10 dark:text-red-300"
                  onClick={() => {
                    setMenuOpen(false);
                    toastInfo("Permanent delete from archive is coming soon.");
                  }}
                >
                  Delete permanently
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </td>
    </tr>
  );
}
