"use client";

import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";

import { brand } from "@/lib/brand";
import { vaultRoutes } from "@/lib/routes";
import { cn } from "@/lib/utils";

import { AddToVaultMenu } from "./AddToVaultMenu";
import { useVaultCommand } from "./VaultCommandProvider";
import { vaultActionFocus } from "./vault-controls";
import { VaultProfileMenu } from "./VaultProfileMenu";

export function VaultMobileHeader() {
  const { setOpen } = useVaultCommand();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border bg-mv-page/95 px-3 backdrop-blur-sm md:hidden">
      <Link href={vaultRoutes.dashboard} className="flex min-w-0 items-center gap-2.5">
        <Image
          src={brand.logo.src}
          alt={brand.logo.alt}
          width={brand.logo.width}
          height={brand.logo.height}
          placeholder="empty"
          unoptimized
          className="mv-logo size-8 shrink-0 select-none"
        />
        <span className="truncate text-[0.95rem] font-semibold tracking-[-0.02em] text-foreground">
          MindVault
        </span>
      </Link>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label="Open search"
          onClick={() => setOpen(true)}
          className={cn(
            "flex size-9 items-center justify-center rounded-[10px] border border-border bg-surface text-muted-foreground",
            vaultActionFocus,
          )}
        >
          <Search aria-hidden className="size-4" />
        </button>
        <AddToVaultMenu compact />
        <VaultProfileMenu compact />
      </div>
    </header>
  );
}
