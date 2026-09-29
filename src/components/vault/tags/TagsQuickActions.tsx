"use client";

import { ChevronRight, GitMerge, Pencil, Trash2 } from "lucide-react";

import { mvContentCardClassName } from "@/lib/mv/layout-tokens";
import type { SerializedTag } from "@/lib/tags/tags-client";
import { toastInfo } from "@/lib/vault-toast";
import { cn } from "@/lib/utils";

type TagsQuickActionsProps = {
  selectedTag: SerializedTag | null;
  onRename: () => void;
  onDelete: () => void;
};

function QuickActionRow({
  icon: Icon,
  title,
  description,
  onClick,
  tone = "default",
}: {
  icon: typeof GitMerge;
  title: string;
  description: string;
  onClick: () => void;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-3 rounded-[var(--mv-radius-control)] border border-border bg-mv-panel/30 px-3 py-2.5 text-left transition-colors",
        "hover:border-foreground/12 hover:bg-mv-panel/60",
        tone === "danger" && "border-red-400/15 hover:border-red-400/25",
      )}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-[var(--mv-radius-control)] border border-border bg-surface",
          tone === "danger" && "border-red-400/20 text-red-500 dark:text-red-300",
        )}
      >
        <Icon aria-hidden className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[0.8125rem] font-medium text-foreground">{title}</span>
        <span className="mt-0.5 block text-[0.75rem] text-muted-foreground">{description}</span>
      </span>
      <ChevronRight
        aria-hidden
        className="size-4 shrink-0 text-mv-faint transition-transform group-hover:translate-x-0.5"
      />
    </button>
  );
}

export function TagsQuickActions({
  selectedTag,
  onRename,
  onDelete,
}: TagsQuickActionsProps) {
  return (
    <section className={cn(mvContentCardClassName, "p-4 sm:p-5")}>
      <h2 className="text-[0.8125rem] font-semibold tracking-[-0.01em] text-foreground">
        Quick Actions
      </h2>
      <div className="mt-4 space-y-2">
        <QuickActionRow
          icon={GitMerge}
          title="Merge Tags"
          description="Combine similar tags"
          onClick={() =>
            toastInfo("Tag merge is coming soon. Select tags from the grid when it ships.")
          }
        />
        <QuickActionRow
          icon={Pencil}
          title="Rename Tag"
          description={
            selectedTag ? `Update “${selectedTag.name}”` : "Select a tag from the list"
          }
          onClick={() => {
            if (!selectedTag) {
              toastInfo("Select a tag first, then choose Rename.");
              return;
            }
            onRename();
          }}
        />
        <QuickActionRow
          icon={Trash2}
          title="Delete Tag"
          description="Remove tag and reassign notes"
          tone="danger"
          onClick={() => {
            if (!selectedTag) {
              toastInfo("Select a tag first, then choose Delete.");
              return;
            }
            onDelete();
          }}
        />
      </div>
    </section>
  );
}
