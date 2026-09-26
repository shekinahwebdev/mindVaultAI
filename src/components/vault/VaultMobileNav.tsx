"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Menu,
  Plus,
  Search,
} from "lucide-react";

import { vaultMobilePrimaryNav, vaultSidebarNav } from "@/lib/vault/nav";
import { vaultRoutes } from "@/lib/routes";
import { cn } from "@/lib/utils";

import { vaultIconShape } from "./vault-controls";

const moreLinks = vaultSidebarNav.filter(
  (item) =>
    !vaultMobilePrimaryNav.some((primary) => primary.href === item.href),
);

export function VaultMobileNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      {moreOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-mv-overlay md:hidden"
          onClick={() => setMoreOpen(false)}
        />
      ) : null}

      <div
        className={cn(
          "fixed inset-x-3 bottom-3 z-50 rounded-[var(--radius-card)] border border-border bg-surface/95 p-2 shadow-[0_16px_40px_rgba(0,0,0,0.18)] backdrop-blur-md transition md:hidden",
          moreOpen
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-2 opacity-0",
        )}
      >
        <div className="grid gap-1">
          {moreLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMoreOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.84rem] text-foreground/80 hover:bg-mv-panel"
              >
                <Icon aria-hidden className="size-4 text-mv-faint" />
                {item.label}
                {item.badge ? (
                  <span className="ml-auto rounded-full border border-border px-1.5 py-0.5 text-[0.6875rem] font-medium text-mv-faint">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-mv-panel/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md md:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5 items-end gap-1 pt-1.5">
          {vaultMobilePrimaryNav.slice(0, 2).map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[0.6875rem] font-medium",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <Icon aria-hidden className="size-[1.05rem]" />
                {item.label}
              </Link>
            );
          })}

          <Link
            href={vaultRoutes.capture}
            aria-label="Add note"
            className="-mt-5 flex flex-col items-center gap-1"
          >
            <span
              className={cn(
                "flex size-12 items-center justify-center border border-border bg-primary text-primary-foreground shadow-[0_10px_24px_rgba(0,0,0,0.35)] transition-opacity hover:opacity-90",
                vaultIconShape,
              )}
            >
              <Plus aria-hidden className="size-5" />
            </span>
            <span className="text-[0.6875rem] font-medium text-muted-foreground">
              Add
            </span>
          </Link>

          <Link
            href={vaultRoutes.search}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[0.6875rem] font-medium",
              pathname === vaultRoutes.search ? "text-foreground" : "text-muted-foreground",
            )}
          >
            <Search aria-hidden className="size-[1.05rem]" />
            Search
          </Link>

          <button
            type="button"
            onClick={() => setMoreOpen((open) => !open)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[0.6875rem] font-medium",
              moreOpen ? "text-foreground" : "text-muted-foreground",
            )}
          >
            <Menu aria-hidden className="size-[1.05rem]" />
            More
          </button>
        </div>
      </nav>
    </>
  );
}
