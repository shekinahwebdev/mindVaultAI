"use client";

import { captureNoteTypeOptions } from "@/lib/notes/capture-config";
import type { CaptureFormValues } from "@/lib/notes/capture-client";
import { NoteTypeIcon } from "@/lib/vault/note-type-ui";
import { cn } from "@/lib/utils";

import { vaultActionFocus } from "../vault-controls";

type CaptureTypeSwitcherProps = {
  value: CaptureFormValues["type"];
  onChange: (type: CaptureFormValues["type"]) => void;
  disabled?: boolean;
};

export function CaptureTypeSwitcher({
  value,
  onChange,
  disabled,
}: CaptureTypeSwitcherProps) {
  return (
    <div
      role="tablist"
      aria-label="Capture type"
      className="flex flex-wrap gap-1.5"
    >
      {captureNoteTypeOptions.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={disabled}
            onClick={() => {
              if (!active) {
                onChange(option.value);
              }
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[var(--mv-radius-control)] border px-2.5 py-1.5 text-[0.8125rem] font-medium transition-colors",
              vaultActionFocus,
              active
                ? "border-foreground/15 bg-mv-panel text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.04)]"
                : "border-border bg-surface text-muted-foreground hover:border-foreground/12 hover:bg-mv-panel/60 hover:text-foreground",
              disabled && "opacity-50",
            )}
          >
            <NoteTypeIcon type={option.value} aria-hidden className="size-3.5 opacity-80" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
