"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Moon, Settings, Sun } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

import { useTheme } from "@/components/theme/ThemeProvider";
import { brand } from "@/lib/brand";
import { updatePreferencesRequest } from "@/lib/settings/settings-client";
import { usePreferences } from "@/lib/settings/preferences-context";
import { preferenceToPrismaTheme } from "@/lib/theme";
import { vaultRoutes } from "@/lib/routes";
import {
  isVaultNavActive,
  vaultSidebarPrimaryNav,
  vaultSidebarUtilityNav,
  type VaultNavItem,
} from "@/lib/vault/nav";
import { getVaultInitials } from "@/lib/vault/user-display";
import { cn } from "@/lib/utils";

import {
  vaultActionFocus,
  vaultRailActive,
  vaultRailIdle,
  vaultRailTooltipClassName,
} from "./vault-controls";
import { VaultLogoutAction } from "./VaultLogoutAction";
import { useVaultSession } from "./VaultSessionProvider";
import { useVaultSidebar } from "./VaultSidebarProvider";

const railIconClassName = "size-[1.125rem] stroke-[1.75]";
const SIDEBAR_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const WIDTH_MS = 280;
const LABEL_MS = 200;

/** Collapsed: centered 36px targets. Expanded: full-width rows with fixed icon column. */
function railRowClassName(collapsed: boolean) {
  return collapsed
    ? "mx-auto size-9 shrink-0 items-center justify-center rounded-full"
    : "h-9 w-full min-w-0 items-center rounded-[10px] px-1.5";
}

function railStackClassName(collapsed: boolean) {
  return cn(
    "flex w-full flex-col",
    collapsed ? "items-center gap-1" : "gap-0.5",
  );
}

function sidebarNavText(item: VaultNavItem) {
  return item.expandedLabel ?? item.label;
}

function SidebarLabel({
  children,
  visible,
  reduceMotion,
}: {
  children: ReactNode;
  visible: boolean;
  reduceMotion: boolean | null;
}) {
  if (reduceMotion) {
    return visible ? (
      <span className="min-w-0 flex-1 truncate text-[0.8125rem] font-medium text-foreground">
        {children}
      </span>
    ) : null;
  }

  return (
    <span
      className={cn(
        "min-w-0 flex-1 truncate text-[0.8125rem] font-medium text-foreground",
        "transition-[opacity,transform] ease-out",
        visible
          ? "translate-x-0 opacity-100"
          : "pointer-events-none translate-x-[-6px] opacity-0",
      )}
      style={{
        transitionDuration: `${LABEL_MS}ms`,
        transitionDelay: visible ? "75ms" : "0ms",
      }}
    >
      {children}
    </span>
  );
}

function SidebarNavLink({
  item,
  active,
  collapsed,
  expanded,
  reduceMotion,
}: {
  item: VaultNavItem;
  active: boolean;
  collapsed: boolean;
  expanded: boolean;
  reduceMotion: boolean | null;
}) {
  const Icon = item.icon;
  const tooltip = item.badge
    ? `${item.label} · ${item.badge}`
    : item.label;
  const expandedText = sidebarNavText(item);

  return (
    <Link
      href={item.href}
      aria-label={collapsed ? tooltip : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex transition-colors duration-200",
        railRowClassName(collapsed),
        vaultActionFocus,
        active ? vaultRailActive : vaultRailIdle,
      )}
    >
      {collapsed ? (
        <Icon aria-hidden className={railIconClassName} />
      ) : (
        <span className="relative flex size-9 shrink-0 items-center justify-center">
          <Icon aria-hidden className={railIconClassName} />
        </span>
      )}
      {item.badge && collapsed ? (
        <span
          aria-hidden
          className={cn(
            "absolute top-1.5 right-1.5 size-1.5 rounded-full",
            active ? "bg-primary-foreground/70" : "bg-muted-foreground",
          )}
        />
      ) : null}
      {!collapsed ? (
        <>
          <SidebarLabel visible={expanded} reduceMotion={reduceMotion}>
            {expandedText}
          </SidebarLabel>
          {item.badge ? (
            <span className="mr-1 shrink-0 rounded-md border border-border px-1.5 py-0.5 text-[0.625rem] font-medium text-mv-faint">
              {item.badge}
            </span>
          ) : null}
        </>
      ) : null}
      {collapsed ? (
        <span className={vaultRailTooltipClassName}>{tooltip}</span>
      ) : null}
    </Link>
  );
}

function ThemeToggleRow({
  collapsed,
  expanded,
  reduceMotion,
}: {
  collapsed: boolean;
  expanded: boolean;
  reduceMotion: boolean | null;
}) {
  const { resolved, setPreference } = useTheme();
  const { setPreferences } = usePreferences();
  const isLight = resolved === "light";
  const themeLabel = isLight ? "Dark mode" : "Light mode";
  const appearanceLabel = "Appearance";

  async function choose(next: "light" | "dark") {
    if (resolved === next) {
      return;
    }
    setPreference(next);
    const { data } = await updatePreferencesRequest({
      theme: preferenceToPrismaTheme(next),
    });
    if (data?.ok) {
      setPreferences(data.preferences);
    }
  }

  return (
    <button
      type="button"
      aria-label={themeLabel}
      onClick={() => void choose(isLight ? "dark" : "light")}
      className={cn(
        "group relative flex transition-colors duration-200",
        railRowClassName(collapsed),
        vaultActionFocus,
        vaultRailIdle,
      )}
    >
      {collapsed ? (
        isLight ? (
          <Moon aria-hidden className={railIconClassName} />
        ) : (
          <Sun aria-hidden className={railIconClassName} />
        )
      ) : (
        <span className="flex size-9 shrink-0 items-center justify-center">
          {isLight ? (
            <Moon aria-hidden className={railIconClassName} />
          ) : (
            <Sun aria-hidden className={railIconClassName} />
          )}
        </span>
      )}
      {!collapsed ? (
        <SidebarLabel visible={expanded} reduceMotion={reduceMotion}>
          {appearanceLabel}
        </SidebarLabel>
      ) : null}
      {collapsed ? (
        <span className={vaultRailTooltipClassName}>{themeLabel}</span>
      ) : null}
    </button>
  );
}

function SidebarProfile({
  collapsed,
  expanded,
  reduceMotion,
}: {
  collapsed: boolean;
  expanded: boolean;
  reduceMotion: boolean | null;
}) {
  const session = useVaultSession();
  const initials = getVaultInitials(session);
  const displayName = session.name?.trim() || session.email.split("@")[0];

  return (
    <Link
      href={vaultRoutes.settings}
      aria-label={`Account settings for ${displayName}`}
      className={cn(
        "group relative flex transition-colors duration-200 hover:bg-mv-panel",
        vaultActionFocus,
        collapsed
          ? "mx-auto size-9 shrink-0 items-center justify-center rounded-full"
          : "h-10 w-full min-w-0 items-center rounded-[10px] px-1.5",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex items-center justify-center",
          collapsed ? "size-8" : "size-9 shrink-0",
        )}
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-primary text-[0.68rem] font-medium text-primary-foreground">
          {initials}
        </span>
      </span>
      {!collapsed ? (
        <SidebarLabel visible={expanded} reduceMotion={reduceMotion}>
          {displayName}
        </SidebarLabel>
      ) : null}
      {collapsed ? (
        <span className={vaultRailTooltipClassName}>{displayName}</span>
      ) : null}
    </Link>
  );
}

export function VaultSidebar() {
  const pathname = usePathname();
  const { collapsed, toggleCollapsed } = useVaultSidebar();
  const reduceMotion = useReducedMotion();
  const expanded = !collapsed;

  const widthTransition = reduceMotion
    ? "none"
    : `width ${WIDTH_MS}ms ${SIDEBAR_EASE}`;

  const expandedNavItems = [
    ...vaultSidebarPrimaryNav,
    ...vaultSidebarUtilityNav,
  ];

  return (
    <aside
      className={cn(
        "hidden shrink-0 md:flex md:items-start md:py-2",
        collapsed ? "w-[4.5rem] justify-center" : "w-[15rem]",
      )}
      style={{ transition: widthTransition }}
    >
      <div
        className={cn(
          "mv-rail-capsule sticky top-3 flex flex-col rounded-[20px] border border-border bg-surface py-2.5",
          collapsed
            ? "w-[3.25rem] items-center px-0"
            : "mx-1.5 w-[calc(100%-0.75rem)] overflow-hidden px-2",
        )}
      >
        <div
          className={cn(
            "flex w-full items-center",
            collapsed ? "mb-2 justify-center" : "mb-2 gap-1.5 px-0.5",
          )}
        >
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-expanded={expanded}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "group relative flex size-9 shrink-0 items-center justify-center rounded-[12px] transition-colors hover:bg-mv-panel",
              vaultActionFocus,
            )}
          >
            <Image
              src={brand.logo.src}
              alt=""
              width={brand.logo.width}
              height={brand.logo.height}
              placeholder="empty"
              unoptimized
              className="mv-logo size-7 select-none"
            />
            {collapsed ? (
              <span className={vaultRailTooltipClassName}>Expand sidebar</span>
            ) : null}
          </button>

          {!collapsed ? (
            <Link
              href={vaultRoutes.dashboard}
              className={cn(
                "min-w-0 flex-1 truncate text-[0.9375rem] font-semibold tracking-[-0.02em] text-foreground transition-opacity ease-out hover:text-foreground/90",
                vaultActionFocus,
                "rounded-[6px]",
              )}
              style={{
                transitionDuration: reduceMotion ? "0ms" : `${LABEL_MS}ms`,
                transitionDelay: reduceMotion ? "0ms" : "75ms",
                opacity: expanded ? 1 : 0,
              }}
            >
              MindVault
            </Link>
          ) : null}
        </div>

        <nav aria-label="Vault" className={railStackClassName(collapsed)}>
          {(expanded ? expandedNavItems : vaultSidebarPrimaryNav).map(
            (item) => (
              <SidebarNavLink
                key={item.href}
                item={item}
                active={isVaultNavActive(pathname, item.href)}
                collapsed={collapsed}
                expanded={expanded}
                reduceMotion={reduceMotion}
              />
            ),
          )}
        </nav>

        <div
          className={cn(
            "mt-3 w-full border-t border-border/60 pt-3",
            railStackClassName(collapsed),
          )}
        >
          <SidebarProfile
            collapsed={collapsed}
            expanded={expanded}
            reduceMotion={reduceMotion}
          />
          <ThemeToggleRow
            collapsed={collapsed}
            expanded={expanded}
            reduceMotion={reduceMotion}
          />
          {collapsed ? (
            <SidebarNavLink
              item={{
                label: "Settings",
                href: vaultRoutes.settings,
                icon: Settings,
              }}
              active={isVaultNavActive(pathname, vaultRoutes.settings)}
              collapsed
              expanded={false}
              reduceMotion={reduceMotion}
            />
          ) : null}
          <div
            className={cn(
              "group relative",
              collapsed ? "flex justify-center" : "w-full",
            )}
          >
            <VaultLogoutAction
              iconOnly={collapsed}
              label="Sign out"
              icon={<LogOut aria-hidden className={railIconClassName} />}
              className={cn(
                collapsed
                  ? "size-9 rounded-full"
                  : "h-9 w-full justify-start gap-2.5 rounded-[10px] px-1.5 text-[0.8125rem] font-medium text-foreground/85",
                vaultRailIdle,
              )}
            />
            {collapsed ? (
              <span
                className={cn(
                  vaultRailTooltipClassName,
                  "group-focus-within:opacity-100",
                )}
              >
                Sign out
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </aside>
  );
}
