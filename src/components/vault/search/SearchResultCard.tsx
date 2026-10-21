import { FileText, StickyNote } from "lucide-react";
import Link from "next/link";

import { NoteTagBadges } from "@/components/vault/tags/NoteTagBadges";
import { formatNoteDate, noteDetailPath, noteTypeLabels } from "@/lib/notes/note-display";
import { vaultRoutes } from "@/lib/routes";
import type { SerializedSearchResult } from "@/lib/search/search-types";
import { cn } from "@/lib/utils";

import { vaultMetaClassName } from "../vault-controls";

type SearchResultCardProps = {
  item: SerializedSearchResult;
};

function searchResultHref(item: SerializedSearchResult): string {
  if (item.kind === "note") {
    return noteDetailPath(item.id);
  }
  return vaultRoutes.documentFocus(item.id, item.pageStart ?? undefined);
}

function pageLabel(item: SerializedSearchResult): string | null {
  if (item.kind !== "document" || item.pageStart === null) return null;
  if (item.pageEnd !== null && item.pageEnd !== item.pageStart) {
    return `Pages ${item.pageStart}–${item.pageEnd}`;
  }
  return `Page ${item.pageStart}`;
}

export function SearchResultCard({ item }: SearchResultCardProps) {
  const isNote = item.kind === "note";
  const page = pageLabel(item);
  const matchLabel =
    item.similarity !== null
      ? `${Math.round(Math.max(0, Math.min(1, item.similarity)) * 100)}% match`
      : null;

  return (
    <Link
      href={searchResultHref(item)}
      className="group block rounded-xl border border-border bg-surface px-4 py-3.5 shadow-[0_1px_2px_rgb(0_0_0/0.03)] transition-colors hover:border-border sm:px-5 sm:py-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-start gap-2.5">
          <span
            className={cn(
              "inline-flex size-8 shrink-0 items-center justify-center rounded-[var(--mv-radius-control)] border border-border bg-mv-panel",
              isNote ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {isNote ? (
              <StickyNote aria-hidden className="size-4" />
            ) : (
              <FileText aria-hidden className="size-4" />
            )}
          </span>
          <div className="min-w-0">
            <p className="text-[0.6875rem] font-medium uppercase tracking-wide text-mv-faint">
              {isNote ? "Note" : "PDF"}
              {isNote && item.noteType
                ? ` · ${noteTypeLabels[item.noteType] ?? item.noteType}`
                : null}
            </p>
            <h2 className="text-[0.95rem] leading-snug text-foreground group-hover:underline">
              {item.title}
            </h2>
          </div>
        </div>
        <span className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
          {matchLabel ? (
            <span
              className={cn(
                "rounded-md border border-border bg-mv-panel px-2 py-0.5",
                vaultMetaClassName,
              )}
            >
              {matchLabel}
            </span>
          ) : null}
          {page ? (
            <span className={cn("rounded-md border border-border bg-mv-panel px-2 py-0.5", vaultMetaClassName)}>
              {page}
            </span>
          ) : null}
        </span>
      </div>

      {item.excerpt ? (
        <p className="mt-2.5 line-clamp-3 text-[0.8125rem] leading-relaxed text-muted-foreground">
          {item.excerpt}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {item.tags.length > 0 ? <NoteTagBadges tags={item.tags.slice(0, 4)} /> : null}
        <span className="text-[0.75rem] text-mv-faint">Updated {formatNoteDate(item.updatedAt)}</span>
      </div>
    </Link>
  );
}
