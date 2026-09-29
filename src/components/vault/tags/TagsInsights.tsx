"use client";

import { BarChart3 } from "lucide-react";
import { useMemo, useState } from "react";

import { mvContentCardClassName } from "@/lib/mv/layout-tokens";
import type { SerializedTag } from "@/lib/tags/tags-client";
import { cn } from "@/lib/utils";

import {
  vaultSegmentedItemActive,
  vaultSegmentedItemIdle,
  vaultSegmentedTrack,
} from "../vault-controls";

type TagsInsightsProps = {
  mostInsights: SerializedTag[];
  leastInsights: SerializedTag[];
  onTagSelect?: (tag: SerializedTag) => void;
};

export function TagsInsights({
  mostInsights,
  leastInsights,
  onTagSelect,
}: TagsInsightsProps) {
  const [mode, setMode] = useState<"most" | "least">("most");

  const ranked = mode === "most" ? mostInsights : leastInsights;

  const maxCount = useMemo(() => {
    if (ranked.length === 0) {
      return 0;
    }
    return Math.max(...ranked.map((tag) => tag.noteCount));
  }, [ranked]);

  return (
    <section className={cn(mvContentCardClassName, "p-4 sm:p-5")}>
      <header className="flex items-center gap-2">
        <BarChart3 aria-hidden className="size-4 text-muted-foreground" />
        <h2 className="text-[0.8125rem] font-semibold tracking-[-0.01em] text-foreground">
          Tag Insights
        </h2>
      </header>

      <div className={cn(vaultSegmentedTrack, "mt-4 grid w-full grid-cols-2")}>
        <button
          type="button"
          aria-pressed={mode === "most"}
          onClick={() => setMode("most")}
          className={cn(
            "min-h-8 px-2 text-[0.75rem] font-medium",
            mode === "most" ? vaultSegmentedItemActive : vaultSegmentedItemIdle,
          )}
        >
          Most used
        </button>
        <button
          type="button"
          aria-pressed={mode === "least"}
          onClick={() => setMode("least")}
          className={cn(
            "min-h-8 px-2 text-[0.75rem] font-medium",
            mode === "least" ? vaultSegmentedItemActive : vaultSegmentedItemIdle,
          )}
        >
          Least used
        </button>
      </div>

      <ul className="mt-4 space-y-3.5">
        {ranked.length === 0 ? (
          <li className="text-[0.8125rem] text-muted-foreground">No tags yet.</li>
        ) : (
          ranked.map((tag) => {
            const pct =
              maxCount > 0
                ? Math.round((tag.noteCount / maxCount) * 100)
                : 0;

            return (
              <li key={tag.id}>
                <div className="flex items-baseline justify-between gap-2 text-[0.8125rem]">
                  {onTagSelect ? (
                    <button
                      type="button"
                      onClick={() => onTagSelect(tag)}
                      className="truncate text-left font-medium text-foreground hover:underline"
                    >
                      {tag.name}
                    </button>
                  ) : (
                    <span className="truncate font-medium text-foreground">{tag.name}</span>
                  )}
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {tag.noteCount.toLocaleString()}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-mv-panel">
                  <div
                    className="h-full rounded-full bg-foreground/75 transition-[width]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })
        )}
      </ul>
    </section>
  );
}
