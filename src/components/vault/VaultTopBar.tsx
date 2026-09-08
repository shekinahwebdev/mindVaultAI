"use client";

import Link from "next/link";
import { Bell, Plus } from "lucide-react";

import { vaultRoutes } from "@/lib/routes";
import { getVaultInitials } from "@/lib/vault/user-display";

import { useVaultSession } from "./VaultSessionProvider";
import { VaultSearchField } from "./VaultUserArea";

export function VaultTopBar() {
  const session = useVaultSession();
  const initials = getVaultInitials(session);

  return (
    <header className="hidden h-[4.25rem] shrink-0 items-center gap-4 border-b border-white/[0.06] bg-brand-void/80 px-5 backdrop-blur-sm md:flex">
      <VaultSearchField className="max-w-xl flex-1" />
      <div className="ml-auto flex items-center gap-2.5">
        <button
          type="button"
          aria-label="Notifications"
          className="inline-flex size-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.02] text-white/45 transition-colors hover:border-white/[0.14] hover:text-white/70"
        >
          <Bell aria-hidden className="size-4" />
        </button>
        <div
          aria-hidden
          className="hidden size-9 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] text-[0.72rem] text-white/70 sm:flex"
        >
          {initials}
        </div>
        <Link
          href={vaultRoutes.capture}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-brand-ink px-4 text-[0.76rem] tracking-[0.14em] text-brand-void uppercase transition-opacity hover:opacity-90"
        >
          <Plus aria-hidden className="size-4" />
          Add Note
        </Link>
      </div>
    </header>
  );
}
