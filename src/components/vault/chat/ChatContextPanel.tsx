"use client";

import { Code2, FileText, Link2, Quote } from "lucide-react";
import Link from "next/link";

import { noteDetailPath, noteTypeLabels } from "@/lib/notes/note-display";

import type { ChatTurn } from "./chat-types";

type ChatContextPanelProps = {
  activeTurn: ChatTurn | null;
  open: boolean;
};

function sourceIcon(type: string) {
  switch (type) {
    case "CODE":
      return Code2;
    case "LINK":
      return Link2;
    case "QUOTE":
      return Quote;
    default:
      return FileText;
  }
}

export function ChatContextPanel({ activeTurn, open }: ChatContextPanelProps) {
  if (!open) {
    return null;
  }

  const sources = activeTurn?.sources ?? [];
  const noRelevantKnowledge =
    activeTurn?.status === "done" && activeTurn.answerOutcome === "no_relevant_knowledge";

  return (
    <aside className="hidden h-full min-h-0 w-[18.5rem] shrink-0 flex-col border-border xl:flex xl:border-l">
      <div className="border-b border-border px-4 py-3">
        <p className="text-[0.8125rem] font-semibold text-foreground">Sources</p>
        <p className="text-[0.75rem] text-muted-foreground">From your vault</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {sources.length > 0 ? (
            <p className="text-[0.75rem] text-muted-foreground">
              {sources.length} source{sources.length === 1 ? "" : "s"} used in the latest answer
            </p>
          ) : null}

          {noRelevantKnowledge ? (
            <p className="text-[0.8125rem] text-muted-foreground">
              No relevant saved content was found.
            </p>
          ) : sources.length === 0 ? (
            <p className="text-[0.8125rem] text-muted-foreground">
              Ask a question to see which notes MindVault used.
            </p>
          ) : (
            <ul className="space-y-2">
              {sources.map((source) => {
                const Icon = sourceIcon(source.type);
                return (
                  <li key={source.noteId}>
                    <Link
                      href={noteDetailPath(source.noteId)}
                      className="flex gap-2.5 rounded-[var(--mv-radius-control)] border border-border bg-mv-panel/40 p-3 transition-colors hover:border-foreground/15 hover:bg-mv-panel/70"
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-surface">
                        <Icon aria-hidden className="size-4 text-muted-foreground" />
                      </span>
                      <span className="min-w-0">
                        <span className="line-clamp-2 text-[0.8125rem] font-medium text-foreground">
                          {source.title}
                        </span>
                        <span className="mt-0.5 block text-[0.6875rem] text-mv-faint">
                          {noteTypeLabels[source.type] ?? source.type}
                          {source.categoryName ? ` · ${source.categoryName}` : ""}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </aside>
  );
}
