"use client";

import { Sparkles } from "lucide-react";

import {
  vaultPageLeadClassName,
  vaultPageTitleClassName,
} from "@/lib/vault/vault-typography";
import { cn } from "@/lib/utils";

import { MindVaultCompanion } from "../MindVaultCompanion";
import { vaultActionFocus } from "../vault-controls";

type DashboardHeroProps = {
  greeting: string;
  name: string;
  lead: string;
  onOpenCommand: () => void;
};

export function DashboardHero({
  greeting,
  name,
  lead,
  onOpenCommand,
}: DashboardHeroProps) {
  return (
    <section className="space-y-3">
      <div>
        <h1 className={vaultPageTitleClassName}>
          {greeting}, {name}{" "}
          <MindVaultCompanion />
        </h1>
        <p className={cn(vaultPageLeadClassName, "mt-1.5")}>{lead}</p>
      </div>

      <div className="space-y-1">
        <button
          type="button"
          onClick={onOpenCommand}
          className={cn(
            "group flex min-h-11 w-full items-center gap-2.5 rounded-[12px] border border-border bg-surface px-3.5 py-2 text-left",
            "transition-[border-color,background-color] duration-200 hover:border-foreground/15 hover:bg-mv-panel/50",
            vaultActionFocus,
          )}
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-[8px] border border-border bg-mv-panel text-muted-foreground group-hover:text-foreground">
            <Sparkles aria-hidden className="size-3.5 stroke-[1.75]" />
          </span>
          <span className="min-w-0 flex-1 text-[0.9375rem] text-muted-foreground group-hover:text-foreground/90">
            Ask anything from your MindVault…
          </span>
          <kbd className="hidden shrink-0 rounded-[6px] border border-border bg-mv-panel px-2 py-0.5 text-[0.75rem] font-medium text-mv-faint sm:inline">
            ⌘K
          </kbd>
        </button>
        <p className="text-[0.8125rem] text-mv-faint">
          Search notes, links, code, quotes, ideas, and saved knowledge.
        </p>
      </div>
    </section>
  );
}
