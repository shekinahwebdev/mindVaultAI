"use client";

import { Plus, Sparkles, X } from "lucide-react";

import type { AnalyzeTagSuggestions } from "@/lib/notes/capture-client";
import { MAX_TAGS_PER_NOTE } from "@/lib/notes/note-tag-limits";
import { cn } from "@/lib/utils";

import { vaultGhostButton } from "../vault-controls";

type TagAnalyzeSuggestionsProps = {
  suggestions: AnalyzeTagSuggestions | null;
  dismissedKeys: Set<string>;
  selectedTagIds: string[];
  disabled?: boolean;
  onDismiss: (key: string) => void;
  onAcceptExisting: (id: string) => void;
  onAcceptNew: (name: string) => void;
  limitMessage?: string;
};

function suggestionKeyExisting(id: string) {
  return `existing:${id}`;
}

function suggestionKeyNew(name: string) {
  return `new:${name.toLowerCase()}`;
}

export function TagAnalyzeSuggestions({
  suggestions,
  dismissedKeys,
  selectedTagIds,
  disabled,
  onDismiss,
  onAcceptExisting,
  onAcceptNew,
  limitMessage,
}: TagAnalyzeSuggestionsProps) {
  if (!suggestions) {
    return null;
  }

  const atLimit = selectedTagIds.length >= MAX_TAGS_PER_NOTE;

  const existing = suggestions.existing.filter(
    (tag) =>
      !dismissedKeys.has(suggestionKeyExisting(tag.id)) &&
      !selectedTagIds.includes(tag.id),
  );

  const newOnes = suggestions.new.filter(
    (name) => !dismissedKeys.has(suggestionKeyNew(name)),
  );

  if (existing.length === 0 && newOnes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 rounded-[var(--mv-radius-control)] border border-dashed border-border/80 bg-mv-panel/25 px-3 py-2.5">
      <p className="flex items-center gap-1.5 text-[0.6875rem] font-medium uppercase tracking-[0.05em] text-muted-foreground">
        <Sparkles aria-hidden className="size-3" />
        Suggested by AI
      </p>

      <ul className="flex flex-wrap gap-1.5">
        {existing.map((tag) => (
          <li key={tag.id}>
            <span className="inline-flex items-center overflow-hidden rounded-full border border-border bg-surface text-[0.75rem]">
              <button
                type="button"
                disabled={disabled || atLimit}
                onClick={() => onAcceptExisting(tag.id)}
                className={cn(
                  vaultGhostButton,
                  "h-7 gap-1 rounded-none border-0 px-2.5 text-[0.75rem] font-medium",
                  atLimit && "opacity-50",
                )}
                aria-label={`Add suggested tag ${tag.name}`}
              >
                <Plus aria-hidden className="size-3" />
                {tag.name}
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onDismiss(suggestionKeyExisting(tag.id))}
                className="flex size-7 items-center justify-center border-l border-border text-mv-faint hover:bg-mv-panel hover:text-foreground"
                aria-label={`Dismiss ${tag.name} suggestion`}
              >
                <X aria-hidden className="size-3" />
              </button>
            </span>
          </li>
        ))}

        {newOnes.map((name) => (
          <li key={name}>
            <span className="inline-flex items-center overflow-hidden rounded-full border border-border bg-surface text-[0.75rem]">
              <button
                type="button"
                disabled={disabled || atLimit}
                onClick={() => onAcceptNew(name)}
                className={cn(
                  vaultGhostButton,
                  "h-7 gap-1 rounded-none border-0 px-2.5 text-[0.75rem] font-medium",
                  atLimit && "opacity-50",
                )}
                aria-label={`Create and add tag ${name}`}
              >
                <Plus aria-hidden className="size-3" />
                {name}
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onDismiss(suggestionKeyNew(name))}
                className="flex size-7 items-center justify-center border-l border-border text-mv-faint hover:bg-mv-panel hover:text-foreground"
                aria-label={`Dismiss ${name} suggestion`}
              >
                <X aria-hidden className="size-3" />
              </button>
            </span>
          </li>
        ))}
      </ul>

      {atLimit ? (
        <p className="text-[0.6875rem] text-muted-foreground" role="status">
          {limitMessage ??
            `This note already has the maximum of ${MAX_TAGS_PER_NOTE} tags.`}
        </p>
      ) : null}
    </div>
  );
}
