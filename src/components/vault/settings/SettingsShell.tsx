"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { SETTINGS_SECTIONS } from "@/lib/settings/settings-config";
import { cn } from "@/lib/utils";

export function SettingsShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <div className="space-y-2">
        <h1 className="font-editorial text-[1.55rem] text-brand-ink italic sm:text-[1.85rem]">
          Settings
        </h1>
        <p className="max-w-xl text-[0.88rem] leading-relaxed text-white/46">
          Your account, vault preferences, and privacy controls.
        </p>
      </div>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <nav
          aria-label="Settings sections"
          className="lg:w-[15rem] lg:shrink-0"
        >
          <ul className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
            {SETTINGS_SECTIONS.map((item) => {
              const active = item.external
                ? pathname === item.href
                : pathname === item.href ||
                  (item.href !== "/vault/settings/account" &&
                    pathname.startsWith(item.href));

              return (
                <li key={item.id} className="shrink-0 lg:shrink">
                  <Link
                    href={item.href}
                    className={cn(
                      "inline-flex min-h-10 items-center rounded-xl border px-3.5 text-[0.78rem] tracking-[0.04em] whitespace-nowrap transition-colors lg:block lg:w-full",
                      active
                        ? "border-white/16 bg-white/[0.06] text-brand-ink"
                        : "border-white/[0.06] bg-white/[0.02] text-white/52 hover:border-white/12 hover:text-white/78",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="min-w-0 flex-1 space-y-5">{children}</div>
      </div>
    </div>
  );
}
