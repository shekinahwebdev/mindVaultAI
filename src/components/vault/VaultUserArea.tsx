"use client";

import { LogOut, Search } from "lucide-react";

import { getVaultInitials } from "@/lib/vault/user-display";
import { cn } from "@/lib/utils";

import { useVaultSession } from "./VaultSessionProvider";
import { VaultLogoutAction } from "./VaultLogoutAction";

type VaultUserAreaProps = {
  compact?: boolean;
};

export function VaultUserArea({ compact = false }: VaultUserAreaProps) {
  const session = useVaultSession();
  const initials = getVaultInitials(session);
  const displayName = session.name?.trim() || session.email.split("@")[0];

  return (
    <div
      className={cn(
        "rounded-xl border border-white/[0.08] bg-white/[0.025] p-2.5",
        compact && "lg:p-3",
      )}
    >
      <div className="flex items-center gap-2.5">
        <div
          aria-hidden
          className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/[0.05] text-[0.72rem] tracking-[0.08em] text-white/78"
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1 hidden lg:block">
          <p className="truncate text-[0.82rem] text-white/88">{displayName}</p>
          <p className="truncate text-[0.72rem] text-white/40">{session.email}</p>
        </div>
        <VaultLogoutAction
          className="hidden lg:inline-flex"
          label="Sign out"
          icon={<LogOut aria-hidden className="size-3.5" />}
        />
      </div>
      <VaultLogoutAction
        className="mt-2 w-full lg:hidden"
        label="Sign out"
        icon={<LogOut aria-hidden className="size-3.5" />}
      />
    </div>
  );
}

export function VaultSearchField({ className }: { className?: string }) {
  return (
    <label className={cn("relative block", className)}>
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/35"
      />
      <input
        readOnly
        aria-label="Search your vault"
        placeholder="Search your vault…"
        className="h-10 w-full rounded-xl border border-white/[0.1] bg-white/[0.03] pr-16 pl-10 text-[0.86rem] text-white/80 outline-none placeholder:text-white/30"
      />
      <span className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded-md border border-white/10 px-1.5 py-0.5 text-[0.62rem] tracking-[0.08em] text-white/32 sm:inline">
        ⌘K
      </span>
    </label>
  );
}
