"use client";

import { Search } from "lucide-react";

import { cn } from "@/lib/utils";

import { AddToVaultMenu } from "./AddToVaultMenu";
import { useVaultCommand } from "./VaultCommandProvider";
import { vaultActionFocus } from "./vault-controls";
import { VaultProfileMenu } from "./VaultProfileMenu";

export function VaultTopBar() {
  const { setOpen } = useVaultCommand();

  return (
    <header className="hidden h-12 shrink-0 items-center gap-2 border-b border-border/60 bg-surface/40 px-[var(--mv-page-padding-x)] backdrop-blur-sm md:flex">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex h-9 min-w-[12rem] flex-1 items-center gap-2 rounded-[10px] border border-border bg-surface px-3 text-[0.8rem] text-muted-foreground transition-colors duration-200 hover:bg-mv-panel hover:text-foreground",
          "max-w-[36rem]",
          vaultActionFocus,
        )}
      >
        <Search aria-hidden className="size-4 shrink-0" />
        <span className="hidden min-w-0 flex-1 text-left lg:inline">Search</span>
        <kbd className="ml-auto hidden rounded-md border border-border bg-mv-panel px-1.5 py-0.5 text-[0.65rem] text-mv-faint xl:inline">
          ⌘K
        </kbd>
      </button>

      <AddToVaultMenu />
      <VaultProfileMenu />
    </header>
  );
}
