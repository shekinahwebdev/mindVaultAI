"use client";

import Link from "next/link";

import { noteDetailPath, noteTypeLabels } from "@/lib/notes/note-display";
import {
  formatDocumentPageLabel,
  groupSourcesForDisplay,
} from "@/lib/rag/source-display";
import { type AskVaultSource } from "@/lib/rag/types";
import { vaultRoutes } from "@/lib/routes";
import { cn } from "@/lib/utils";

type ChatSourceLinksProps = {
  sources: AskVaultSource[];
  linkClassName?: string;
};

const defaultCardClass =
  "rounded-[var(--mv-radius-control)] border border-border bg-mv-panel/40 transition-colors hover:border-foreground/15 hover:bg-mv-panel/70";

export function ChatSourceLinks({ sources, linkClassName }: ChatSourceLinksProps) {
  const grouped = groupSourcesForDisplay(sources);
  const cardClass = linkClassName ?? cn(defaultCardClass, "block px-3 py-2.5");

  return (
    <ul className="space-y-2">
      {grouped.map((entry) => {
        if (entry.type === "document") {
          return (
            <li key={`doc:${entry.documentId}`}>
              <div className={cn(cardClass, "hover:bg-mv-panel/70")}>
                <div className="min-w-0">
                  <Link
                    href={vaultRoutes.documentFocus(entry.documentId)}
                    className="block truncate text-[0.8125rem] font-medium text-foreground underline-offset-2 hover:underline"
                    title={entry.title}
                  >
                    {entry.title}
                  </Link>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {entry.citations.map((citation) => (
                      <Link
                        key={citation.chunkId}
                        href={vaultRoutes.documentFocus(
                          entry.documentId,
                          citation.pageStart,
                        )}
                        className="inline-flex rounded-full border border-border bg-surface/80 px-2 py-0.5 text-[0.6875rem] font-medium text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
                      >
                        {formatDocumentPageLabel(citation.pageStart, citation.pageEnd)}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </li>
          );
        }

        const source = entry.source;
        return (
          <li key={`note:${source.noteId}`}>
            <Link href={noteDetailPath(source.noteId)} className={cn(cardClass, "block min-w-0")}>
              <span
                className="block truncate text-[0.8125rem] font-medium text-foreground"
                title={source.title}
              >
                {source.title}
              </span>
              <span className="mt-0.5 block text-[0.6875rem] text-mv-faint">
                {noteTypeLabels[source.type] ?? source.type}
                {source.categoryName ? ` · ${source.categoryName}` : ""}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
