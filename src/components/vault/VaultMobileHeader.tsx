"use client";

import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";

import { brand } from "@/lib/brand";
import { vaultRoutes } from "@/lib/routes";
import { getVaultInitials } from "@/lib/vault/user-display";

import { useVaultSession } from "./VaultSessionProvider";

export function VaultMobileHeader() {
  const session = useVaultSession();
  const initials = getVaultInitials(session);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.06] bg-brand-void/95 px-4 backdrop-blur-sm md:hidden">
      <Link href="/vault" className="flex items-center gap-2.5">
        <Image
          src={brand.logo.src}
          alt={brand.logo.alt}
          width={brand.logo.width}
          height={brand.logo.height}
          placeholder="empty"
          unoptimized
          className="size-8 select-none"
        />
        <span className="font-editorial text-[1rem] text-brand-ink italic">
          MindVault
        </span>
      </Link>
      <div className="flex items-center gap-2">
        <div
          aria-hidden
          className="flex size-8 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] text-[0.68rem] text-white/70"
        >
          {initials}
        </div>
        <Link
          href={vaultRoutes.capture}
          aria-label="Add note"
          className="inline-flex size-9 items-center justify-center rounded-full bg-brand-ink text-brand-void transition-opacity hover:opacity-90"
        >
          <Plus aria-hidden className="size-4" />
        </Link>
      </div>
    </header>
  );
}
