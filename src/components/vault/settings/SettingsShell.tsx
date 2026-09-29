"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { PageHeader } from "@/components/mv/PageHeader";
import { PageStack } from "@/components/mv/PageStack";
import { SETTINGS_SECTIONS } from "@/lib/settings/settings-config";
import { SETTINGS_NAV_ICONS } from "@/lib/settings/settings-nav-icons";
import { cn } from "@/lib/utils";

import {
  settingsCompositionClassName,
  settingsContentColumnClassName,
  settingsGridClassName,
  settingsNavCardClassName,
  settingsNavWidthClassName,
  settingsPageContainerClassName,
} from "./settings-ui";

export function SettingsShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className={cn(settingsPageContainerClassName, "pb-4 pt-1 lg:pt-2")}>
      <div className={settingsCompositionClassName}>
        <PageStack className="gap-5 lg:gap-6">
          <PageHeader
            title="Settings"
            lead="Manage your account, preferences and how MindVault works for you."
          />

          <div className={settingsGridClassName}>
            <nav
              aria-label="Settings sections"
              className={settingsNavWidthClassName}
            >
              <div className={settingsNavCardClassName}>
                <ul className="flex flex-col gap-0.5 p-1">
                  {SETTINGS_SECTIONS.map((item) => {
                    const Icon = SETTINGS_NAV_ICONS[item.id];
                    const active =
                      pathname === item.href ||
                      (item.href !== "/vault/settings/account" &&
                        pathname.startsWith(item.href));

                    return (
                      <li key={item.id}>
                        <Link
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "flex min-h-[42px] items-center gap-2.5 rounded-[var(--mv-radius-control)] px-2.5 py-2 text-[0.8125rem] font-medium transition-colors duration-200",
                            active
                              ? "bg-mv-panel text-foreground"
                              : "text-muted-foreground hover:bg-mv-panel/70 hover:text-foreground",
                          )}
                        >
                          <Icon
                            aria-hidden
                            className={cn(
                              "size-4 shrink-0",
                              active ? "text-foreground" : "text-mv-faint",
                            )}
                          />
                          <span className="min-w-0 truncate">{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </nav>

            <div className={settingsContentColumnClassName}>{children}</div>
          </div>
        </PageStack>
      </div>
    </div>
  );
}
