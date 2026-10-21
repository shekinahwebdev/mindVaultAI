"use client";

import { FileText, MoreHorizontal, StickyNote } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { ContentCard } from "@/components/mv/ContentCard";
import { NoteTagBadges } from "@/components/vault/tags/NoteTagBadges";
import { formatNoteDate, noteDetailPath, noteTypeLabels } from "@/lib/notes/note-display";
import { vaultRoutes } from "@/lib/routes";
import type { SerializedLibraryItem } from "@/lib/library/library-types";
import { cn } from "@/lib/utils";

import { vaultActionFocus } from "../vault-controls";

import { LibraryAddToCollectionDialog } from "./LibraryAddToCollectionDialog";
import { LibraryManageTagsDialog } from "./LibraryManageTagsDialog";

type LibraryItemCardProps = {
  item: SerializedLibraryItem;
  onTagsUpdated?: () => void;
};

function libraryItemHref(item: SerializedLibraryItem): string {
  if (item.kind === "note") {
    return noteDetailPath(item.id);
  }
  return vaultRoutes.documentFocus(item.id);
}

export function LibraryItemCard({ item, onTagsUpdated }: LibraryItemCardProps) {
  const isNote = item.kind === "note";
  const [menuOpen, setMenuOpen] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [collectionOpen, setCollectionOpen] = useState(false);
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
    <>
      <ContentCard className="flex h-full flex-col transition-colors hover:border-mv-border/80" padding="md">
        <div className="flex items-start justify-between gap-3">
          <Link href={libraryItemHref(item)} className="group flex min-w-0 flex-1 items-center gap-2">
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
              <h3 className="truncate text-[0.9375rem] font-medium text-foreground group-hover:underline">
                {item.title}
              </h3>
            </div>
          </Link>
          <div className="flex shrink-0 items-start gap-2">
            {!isNote && item.processingLabel ? (
              <span className="rounded-full border border-border px-2 py-0.5 text-[0.6875rem] text-muted-foreground">
                {item.processingLabel}
              </span>
            ) : null}
            <div ref={menuRef} className="relative">
              <button
                type="button"
                aria-label={`Organize ${item.title}`}
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
                  className="absolute top-full right-0 z-20 mt-1 min-w-[10rem] rounded-[var(--mv-radius-control)] border border-border bg-surface p-1 shadow-[var(--mv-shadow-elevated)]"
                >
                  <button
                    type="button"
                    role="menuitem"
                    className="block w-full rounded-[6px] px-2.5 py-2 text-left text-[0.8125rem] hover:bg-mv-panel"
                    onClick={() => {
                      setMenuOpen(false);
                      setCollectionOpen(true);
                    }}
                  >
                    Add to collection
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="block w-full rounded-[6px] px-2.5 py-2 text-left text-[0.8125rem] hover:bg-mv-panel"
                    onClick={() => {
                      setMenuOpen(false);
                      setTagsOpen(true);
                    }}
                  >
                    Manage tags
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <Link href={libraryItemHref(item)} className="group block flex-1">
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
        </Link>
      </ContentCard>

      <LibraryManageTagsDialog
        open={tagsOpen}
        item={tagsOpen ? item : null}
        onClose={() => setTagsOpen(false)}
        onSaved={() => onTagsUpdated?.()}
      />
      <LibraryAddToCollectionDialog
        open={collectionOpen}
        item={collectionOpen ? item : null}
        onClose={() => setCollectionOpen(false)}
      />
    </>
  );
}
