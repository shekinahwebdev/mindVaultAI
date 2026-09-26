"use client";

import { LogOut, Search } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

import { vaultRailTooltipClassName } from "./vault-controls";
import { VaultLogoutAction } from "./VaultLogoutAction";

export function VaultUserArea() {
  return (
    <div className="flex flex-col items-center">
      <div className="group relative">
        <VaultLogoutAction
          iconOnly
          label="Sign out"
          icon={<LogOut aria-hidden className="size-4" />}
          className="text-mv-faint hover:text-foreground/85"
        />
        <span className={cn(vaultRailTooltipClassName, "group-focus-within:opacity-100")}>
          Sign out
        </span>
      </div>
    </div>
  );
}

export function VaultSearchField({ className }: { className?: string }) {
  return (
    <Link
      href="/vault/search"
      aria-label="Search your vault"
      className={cn(
        "relative flex h-10 items-center rounded-[10px] border border-border bg-surface pr-16 pl-10 text-[0.86rem] shadow-[0_1px_2px_rgb(0_0_0/0.03)]",
        className,
      )}
    >
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-mv-faint"
      />
      <span className="truncate text-mv-faint">Search your vault…</span>
      <span className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded-md border border-border px-1.5 py-0.5 text-[0.62rem] tracking-[0.08em] text-mv-faint sm:inline">
        ⌘K
      </span>
    </Link>
  );
}
