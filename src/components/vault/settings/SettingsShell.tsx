"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { SETTINGS_SECTIONS } from "@/lib/settings/settings-config";
import { cn } from "@/lib/utils";

import {
  vaultPageLeadClassName,
  vaultPageTitleClassName,
} from "@/lib/vault/vault-typography";

import {
  settingsCompositionClassName,
  settingsContentColumnClassName,
  settingsGridClassName,
  settingsNavWidthClassName,
  settingsPageContainerClassName,
} from "./settings-ui";

export function SettingsShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className={cn(settingsPageContainerClassName, "pb-2 pt-2 lg:pt-4")}>
      <div className={settingsCompositionClassName}>
        <header className="mb-6 lg:mb-8">
          <h1 className={vaultPageTitleClassName}>Settings</h1>
          <p className={vaultPageLeadClassName}>
            Your account, vault preferences, and privacy controls.
          </p>
        </header>

        <div className={settingsGridClassName}>
          <nav
            aria-label="Settings sections"
            className={settingsNavWidthClassName}
          >
            <ul className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 md:mx-0 md:flex-col md:gap-0.5 md:overflow-visible md:px-0 md:pb-0">
              {SETTINGS_SECTIONS.map((item) => {
                const active = item.external
                  ? pathname === item.href
                  : pathname === item.href ||
                    (item.href !== "/vault/settings/account" &&
                      pathname.startsWith(item.href));

                return (
                  <li key={item.id} className="shrink-0 md:shrink">
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "inline-flex min-h-[42px] items-center rounded-[8px] border px-3 text-[0.8125rem] font-medium whitespace-nowrap transition-colors duration-200 md:block md:w-full",
                        active
                          ? "border-border bg-mv-panel text-foreground"
                          : "border-transparent text-muted-foreground hover:bg-mv-panel/70 hover:text-foreground",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className={settingsContentColumnClassName}>{children}</div>
        </div>
      </div>
    </div>
  );
}
