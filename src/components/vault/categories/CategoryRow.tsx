"use client";

import { Pencil, Trash2 } from "lucide-react";

import type { SerializedCategory } from "@/lib/categories/category-client";

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
    <li className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[0.92rem] text-white/88">{category.name}</p>
        <p className="mt-0.5 text-[0.74rem] text-white/38">{noteLabel}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={() => onRename(category)}
          disabled={busy}
          aria-label={`Rename ${category.name}`}
          className="inline-flex size-9 items-center justify-center rounded-lg border border-white/10 text-white/45 transition-colors hover:border-white/16 hover:text-white/72 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Pencil aria-hidden className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(category)}
          disabled={busy}
          aria-label={`Delete ${category.name}`}
          className="inline-flex size-9 items-center justify-center rounded-lg border border-white/10 text-white/45 transition-colors hover:border-white/16 hover:text-white/72 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 aria-hidden className="size-3.5" />
        </button>
      </div>
    </li>
  );
}
