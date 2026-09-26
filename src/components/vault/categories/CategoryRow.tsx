"use client";

import { Pencil, Trash2 } from "lucide-react";

import type { SerializedCategory } from "@/lib/categories/category-client";
import { cn } from "@/lib/utils";

import { vaultIconShape } from "../vault-controls";

type CategoryRowProps = {
  category: SerializedCategory;
  onRename: (category: SerializedCategory) => void;
  onDelete: (category: SerializedCategory) => void;
  busy?: boolean;
};

export function CategoryRow({
  category,
  onRename,
  onDelete,
  busy,
}: CategoryRowProps) {
  const noteLabel =
    category.noteCount === 1
      ? "1 note"
      : `${category.noteCount} notes`;

  return (
    <li className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3.5 shadow-[0_1px_2px_rgb(0_0_0/0.03)]">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[0.92rem] text-foreground">{category.name}</p>
        <p className="mt-0.5 text-[0.74rem] text-mv-faint">{noteLabel}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={() => onRename(category)}
          disabled={busy}
          aria-label={`Rename ${category.name}`}
          className={cn(
            "inline-flex size-10 items-center justify-center border border-border text-mv-faint transition-colors hover:border-border hover:text-foreground/80 disabled:cursor-not-allowed disabled:opacity-50",
            vaultIconShape,
          )}
        >
          <Pencil aria-hidden className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(category)}
          disabled={busy}
          aria-label={`Delete ${category.name}`}
          className={cn(
            "inline-flex size-10 items-center justify-center border border-border text-mv-faint transition-colors hover:border-border hover:text-foreground/80 disabled:cursor-not-allowed disabled:opacity-50",
            vaultIconShape,
          )}
        >
          <Trash2 aria-hidden className="size-3.5" />
        </button>
      </div>
    </li>
  );
}
