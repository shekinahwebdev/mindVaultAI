"use client";

import { groupSourcesForDisplay } from "@/lib/rag/source-display";

import type { ChatTurn } from "./chat-types";
import { ChatSourceLinks } from "./ChatSourceLinks";

type ChatContextPanelProps = {
  activeTurn: ChatTurn | null;
  open: boolean;
};

export function ChatContextPanel({ activeTurn, open }: ChatContextPanelProps) {
  if (!open) {
    return null;
  }

  const sources = activeTurn?.sources ?? [];
  const groupedCount = groupSourcesForDisplay(sources).length;
  const noRelevantKnowledge =
    activeTurn?.status === "done" && activeTurn.answerOutcome === "no_relevant_knowledge";

  return (
    <aside className="hidden h-full min-h-0 w-[20rem] shrink-0 flex-col border-border xl:flex xl:border-l">
      <div className="border-b border-border px-4 py-3">
        <p className="text-[0.8125rem] font-semibold text-foreground">Sources</p>
        <p className="text-[0.75rem] text-muted-foreground">From your vault</p>
      </div>

      <div className="mv-scrollbar mv-scrollbar-chat min-h-0 flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {sources.length > 0 ? (
            <p className="text-[0.75rem] leading-relaxed text-muted-foreground">
              {groupedCount} item{groupedCount === 1 ? "" : "s"} cited
              {sources.length !== groupedCount
                ? ` from ${sources.length} passages`
                : ""}{" "}
              in the latest answer
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
            <ChatSourceLinks
              sources={sources}
              linkClassName="flex gap-2.5 rounded-[var(--mv-radius-control)] border border-border bg-mv-panel/40 p-3 transition-colors hover:border-foreground/15 hover:bg-mv-panel/70"
            />
          )}
        </div>
      </div>
    </aside>
  );
}
