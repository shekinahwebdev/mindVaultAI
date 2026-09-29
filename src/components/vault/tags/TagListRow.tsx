"use client";

import { MoreHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { getTagColor } from "@/lib/vault/tag-colors";
import type { SerializedTag } from "@/lib/tags/tags-client";
import { cn } from "@/lib/utils";

import { vaultActionFocus } from "../vault-controls";

type TagListRowProps = {
  tag: SerializedTag;
  selected?: boolean;
  onSelect: (tag: SerializedTag) => void;
  onRename: (tag: SerializedTag) => void;
  onDelete: (tag: SerializedTag) => void;
};

export function TagListRow({
  tag,
  selected,
  onSelect,
  onRename,
  onDelete,
}: TagListRowProps) {
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

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [menuOpen]);

  return (
    <li>
      <div
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
          "flex cursor-pointer items-center gap-3 border-b border-border px-4 py-3.5 transition-colors last:border-b-0 hover:bg-mv-panel/40",
          selected && "bg-mv-panel/50",
        )}
      >
        <span
          aria-hidden
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.875rem] font-medium text-foreground">{tag.name}</p>
        </div>
        <p className="shrink-0 text-[0.8125rem] tabular-nums text-muted-foreground">
          {noteLabel}
        </p>
        <div ref={menuRef} className="relative shrink-0">
          <button
            type="button"
            aria-label={`Actions for ${tag.name}`}
            onClick={(event) => {
              event.stopPropagation();
              setMenuOpen((open) => !open);
            }}
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
              className="absolute top-full right-0 z-20 mt-1 min-w-[9.5rem] rounded-[var(--mv-radius-control)] border border-border bg-surface p-1 shadow-[var(--mv-shadow-elevated)]"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                role="menuitem"
                className="block w-full rounded-[6px] px-2.5 py-2 text-left text-[0.8125rem] hover:bg-mv-panel"
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
    </li>
  );
}
