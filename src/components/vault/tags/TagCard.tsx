"use client";

import { MoreHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { getTagColor } from "@/lib/vault/tag-colors";
import type { SerializedTag } from "@/lib/tags/tags-client";
import { cn } from "@/lib/utils";

import { vaultActionFocus } from "../vault-controls";

type TagCardProps = {
  tag: SerializedTag;
  selected?: boolean;
  onSelect: (tag: SerializedTag) => void;
  onRename: (tag: SerializedTag) => void;
  onDelete: (tag: SerializedTag) => void;
};

export function TagCard({
  tag,
  selected,
  onSelect,
  onRename,
  onDelete,
}: TagCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const color = getTagColor(tag.name);

  const noteLabel =
    tag.noteCount === 1 ? "1 note" : `${tag.noteCount.toLocaleString()} notes`;

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
    <li>
      <article
        role="button"
        tabIndex={0}
        onClick={() => onSelect(tag)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect(tag);
          }
        }}
        className={cn(
          "relative flex h-full cursor-pointer flex-col rounded-[var(--mv-radius-card)] border bg-surface p-4 sm:p-5",
          "shadow-[var(--mv-shadow-card)] transition-colors hover:border-foreground/12",
          selected ? "border-foreground/25 ring-1 ring-foreground/10" : "border-border",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <span
            aria-hidden
            className="mt-0.5 size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: color }}
          />
          <div ref={menuRef} className="relative shrink-0">
            <button
              type="button"
              aria-label={`Actions for ${tag.name}`}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              onClick={(event) => {
                event.stopPropagation();
                setMenuOpen((open) => !open);
              }}
              className={cn(
                "flex size-8 items-center justify-center rounded-[var(--mv-radius-control)] text-mv-faint transition-colors",
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
                className="absolute top-full right-0 z-20 mt-1 min-w-[9.5rem] rounded-[var(--mv-radius-control)] border border-border bg-surface p-1 shadow-[var(--mv-shadow-elevated)]"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  role="menuitem"
                  className="block w-full rounded-[6px] px-2.5 py-2 text-left text-[0.8125rem] text-foreground hover:bg-mv-panel"
                  onClick={() => {
                    setMenuOpen(false);
                    onRename(tag);
                  }}
                >
                  Rename
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="block w-full rounded-[6px] px-2.5 py-2 text-left text-[0.8125rem] text-red-600 hover:bg-red-500/10 dark:text-red-300"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(tag);
                  }}
                >
                  Delete
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-5 min-w-0 flex-1">
          <h2 className="line-clamp-2 text-[0.9375rem] font-semibold tracking-[-0.01em] text-foreground sm:text-[1rem]">
            {tag.name}
          </h2>
          <p className="mt-1.5 text-[0.8125rem] text-muted-foreground">{noteLabel}</p>
        </div>
      </article>
    </li>
  );
}
