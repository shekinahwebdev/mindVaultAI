"use client";

import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

import { vaultActionFocus, vaultInputClassName } from "../vault-controls";

type DashboardAskBarProps = {
  onOpenCommand: () => void;
  className?: string;
};

export function DashboardAskBar({ onOpenCommand, className }: DashboardAskBarProps) {
  function openCommand() {
    onOpenCommand();
  }

  return (
    <div className={cn("w-full", className)}>
      <label htmlFor="dashboard-ask-input" className="sr-only">
        Ask or search your MindVault
      </label>
      <div className="relative">
        <Sparkles
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 stroke-[1.75] text-muted-foreground"
        />
        <input
          id="dashboard-ask-input"
          type="search"
          readOnly
          placeholder="Ask anything from your MindVault…"
          onClick={openCommand}
          onFocus={(event) => {
            event.target.blur();
            openCommand();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openCommand();
            }
          }}
          className={cn(
            vaultInputClassName,
            "h-11 cursor-text pr-14 pl-10 text-[0.9375rem] placeholder:text-muted-foreground",
            vaultActionFocus,
          )}
        />
        <kbd className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded-[6px] border border-border bg-mv-panel px-2 py-0.5 text-[0.75rem] font-medium text-mv-faint sm:inline">
          ⌘K
        </kbd>
      </div>
      <p className="mt-1.5 text-[0.8125rem] text-mv-faint">
        Search notes, links, code, quotes, ideas, and saved knowledge.
      </p>
    </div>
  );
}
