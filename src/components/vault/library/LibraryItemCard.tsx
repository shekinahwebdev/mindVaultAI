import { FileText, StickyNote } from "lucide-react";
import Link from "next/link";

import { ContentCard } from "@/components/mv/ContentCard";
import { NoteTagBadges } from "@/components/vault/tags/NoteTagBadges";
import { formatNoteDate, noteDetailPath, noteTypeLabels } from "@/lib/notes/note-display";
import { vaultRoutes } from "@/lib/routes";
import type { SerializedLibraryItem } from "@/lib/library/library-types";
import { cn } from "@/lib/utils";

type LibraryItemCardProps = {
  item: SerializedLibraryItem;
};

function libraryItemHref(item: SerializedLibraryItem): string {
  if (item.kind === "note") {
    return noteDetailPath(item.id);
  }
  return vaultRoutes.documentFocus(item.id);
}

export function LibraryItemCard({ item }: LibraryItemCardProps) {
  const isNote = item.kind === "note";

  return (
    <Link href={libraryItemHref(item)} className="group block h-full">
    <ContentCard className="h-full transition-colors hover:border-mv-border/80" padding="md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
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
              {isNote && item.noteType ? ` · ${noteTypeLabels[item.noteType] ?? item.noteType}` : null}
            </p>
            <h3 className="truncate text-[0.9375rem] font-medium text-foreground group-hover:underline">
              {item.title}
            </h3>
          </div>
        </div>
        {!isNote && item.processingLabel ? (
          <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[0.6875rem] text-muted-foreground">
            {item.processingLabel}
          </span>
        ) : null}
      </div>

      {item.preview ? (
        <p className="mt-3 line-clamp-2 text-[0.8125rem] leading-relaxed text-muted-foreground">
          {item.preview}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {item.tags.length > 0 ? <NoteTagBadges tags={item.tags.slice(0, 3)} /> : null}
        <span className="text-[0.75rem] text-mv-faint">
          Updated {formatNoteDate(item.updatedAt)}
        </span>
      </div>
    </ContentCard>
    </Link>
  );
}
