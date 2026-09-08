"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { brand } from "@/lib/brand";
import { vaultSidebarNav } from "@/lib/vault/nav";
import { cn } from "@/lib/utils";

import { VaultUserArea } from "./VaultUserArea";

export function VaultSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-svh w-[4.75rem] shrink-0 flex-col border-r border-white/[0.08] bg-[#0a0a0c] md:flex lg:w-[15.5rem]">
      <div className="flex h-[4.25rem] items-center border-b border-white/[0.06] px-3 lg:px-5">
        <Link href="/vault" className="flex min-w-0 items-center gap-3">
          <Image
            src={brand.logo.src}
            alt={brand.logo.alt}
            width={brand.logo.width}
            height={brand.logo.height}
            placeholder="empty"
            unoptimized
            className="size-9 shrink-0 select-none lg:size-10"
          />
          <span className="hidden truncate font-editorial text-[1.05rem] text-brand-ink italic lg:block">
            MindVault
          </span>
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-4 lg:px-3">
        {vaultSidebarNav.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/vault" && pathname.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-[0.82rem] transition-colors lg:px-3",
                active
                  ? "bg-white/[0.07] text-brand-ink"
                  : "text-white/52 hover:bg-white/[0.04] hover:text-white/82",
              )}
            >
              <Icon
                aria-hidden
                className={cn(
                  "size-[1.05rem] shrink-0 transition-colors",
                  active ? "text-brand-ink" : "text-white/45 group-hover:text-white/70",
                )}
              />
              <span className="hidden min-w-0 flex-1 truncate lg:block">
                {item.label}
              </span>
              {item.badge ? (
                <span className="hidden rounded-full border border-white/12 px-1.5 py-0.5 text-[0.58rem] tracking-[0.12em] text-white/42 uppercase lg:inline-flex">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/[0.06] p-2 lg:p-3">
        <VaultUserArea compact />
      </div>
    </aside>
  );
}
