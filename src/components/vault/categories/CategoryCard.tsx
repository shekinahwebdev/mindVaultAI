"use client";

import { MoreHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { CategoryIcon } from "@/lib/categories/category-icons";
import type { SerializedCategory } from "@/lib/categories/category-client";
import { cn } from "@/lib/utils";

import { vaultActionFocus } from "../vault-controls";

type CategoryCardProps = {
  category: SerializedCategory;
  onRename: (category: SerializedCategory) => void;
  onDelete: (category: SerializedCategory) => void;
  busy?: boolean;
};

export function CategoryCard({
  category,
  onRename,
  onDelete,
  busy,
}: CategoryCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const noteLabel =
    category.noteCount === 1 ? "1 note" : `${category.noteCount} notes`;

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
        className={cn(
          "flex h-full flex-col rounded-[var(--mv-radius-card)] border border-border bg-surface p-4 sm:p-5",
          "shadow-[var(--mv-shadow-card)] transition-colors hover:border-foreground/12",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-[var(--mv-radius-control)] border border-border bg-mv-panel text-foreground">
            <CategoryIcon
              name={category.name}
              aria-hidden
              className="size-[1.125rem] stroke-[1.65]"
            />
          </span>
          <div ref={menuRef} className="relative shrink-0">
            <button
              type="button"
              aria-label={`Actions for ${category.name}`}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              disabled={busy}
              onClick={() => setMenuOpen((open) => !open)}
              className={cn(
                "flex size-8 items-center justify-center rounded-[var(--mv-radius-control)] text-mv-faint transition-colors",
                "hover:bg-mv-panel hover:text-foreground disabled:opacity-50",
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
              >
                <button
                  type="button"
                  role="menuitem"
                  className="block w-full rounded-[6px] px-2.5 py-2 text-left text-[0.8125rem] text-foreground hover:bg-mv-panel"
                  onClick={() => {
                    setMenuOpen(false);
                    onRename(category);
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
                    onDelete(category);
                  }}
                >
                  Delete
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-6 min-w-0 flex-1">
          <h2 className="line-clamp-2 text-[0.9375rem] font-semibold tracking-[-0.01em] text-foreground sm:text-[1rem]">
            {category.name}
          </h2>
          <p className="mt-1.5 text-[0.8125rem] text-muted-foreground">{noteLabel}</p>
        </div>
      </article>
    </li>
  );
}
