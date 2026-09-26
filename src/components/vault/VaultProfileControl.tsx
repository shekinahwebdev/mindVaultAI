"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";

import { vaultRoutes } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { getVaultInitials } from "@/lib/vault/user-display";

import { vaultActionFocus } from "./vault-controls";
import { useVaultSession } from "./VaultSessionProvider";

export function VaultProfileControl({ compact = false }: { compact?: boolean }) {
  const session = useVaultSession();
  const initials = getVaultInitials(session);
  const displayName = session.name?.trim() || session.email.split("@")[0];

  return (
    <Link
      href={vaultRoutes.settings}
      aria-label={`Account settings for ${displayName}`}
      className={cn(
        "flex items-center gap-1.5 rounded-full bg-surface py-0.5 pr-2 pl-0.5 shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-colors hover:bg-mv-panel",
        vaultActionFocus,
        compact && "bg-transparent pr-0 shadow-none hover:bg-mv-panel",
      )}
    >
      <span
        aria-hidden
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-[0.68rem] font-medium text-primary-foreground"
      >
        {initials}
      </span>
      {compact ? null : (
        <>
          <span className="hidden max-w-[7.5rem] truncate text-[0.78rem] font-medium text-foreground lg:inline">
            {displayName}
          </span>
          <ChevronDown aria-hidden className="hidden size-3.5 text-mv-faint lg:block" />
        </>
      )}
    </Link>
  );
}
