"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Monitor, Moon, Sun } from "lucide-react";
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
  vaultSidebarCaptureNav,
  vaultSidebarPrimaryNav,
  vaultSidebarUtilityNav,
  type VaultNavItem,
} from "@/lib/vault/nav";
import type { ThemePreference } from "@/lib/theme";
import { getVaultInitials } from "@/lib/vault/user-display";
import { cn } from "@/lib/utils";

import {
  vaultActionFocus,
  vaultRailActive,
  vaultRailIdle,
  vaultRailTooltipClassName,
} from "./vault-controls";
import { useVaultSession } from "./VaultSessionProvider";
import { useVaultSidebar } from "./VaultSidebarProvider";
import { vaultCaptureNavClassName, vaultSidebarRailClassName } from "./vault-shell-ui";

const railIconClassName = "size-[1.125rem] stroke-[1.75]";
const SIDEBAR_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const WIDTH_MS = 280;
const LABEL_MS = 200;

/** Collapsed: centered 36px targets. Expanded: same flex row as Dashboard nav items. */
function railRowClassName(collapsed: boolean) {
  return collapsed
    ? "mx-auto size-9 shrink-0 items-center justify-center rounded-full"
    : "flex h-9 w-full min-w-0 items-center gap-3 px-2 rounded-[10px]";
}

const railExpandedIconClassName = cn(railIconClassName, "shrink-0");

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
      <span className="min-w-0 truncate text-[0.8125rem] font-medium leading-none text-foreground">
        {children}
      </span>
    ) : null;
  }

  return (
    <span
      className={cn(
        "min-w-0 truncate text-[0.8125rem] font-medium leading-none text-foreground",
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
  className,
}: {
  item: VaultNavItem;
  active: boolean;
  collapsed: boolean;
  expanded: boolean;
  reduceMotion: boolean | null;
  className?: string;
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
        "group relative transition-colors duration-200",
        collapsed ? "flex" : undefined,
        railRowClassName(collapsed),
        vaultActionFocus,
        active ? vaultRailActive : vaultRailIdle,
        className,
      )}
    >
      {collapsed ? (
        <Icon aria-hidden className={railIconClassName} />
      ) : (
        <Icon aria-hidden className={railExpandedIconClassName} />
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
        item.badge ? (
          <div className="flex min-w-0 items-center justify-between gap-2">
            <SidebarLabel visible={expanded} reduceMotion={reduceMotion}>
              {expandedText}
            </SidebarLabel>
            <span className="shrink-0 rounded-md border border-border px-1.5 py-0.5 text-[0.625rem] font-medium text-mv-faint">
              {item.badge}
            </span>
          </div>
        ) : (
          <SidebarLabel visible={expanded} reduceMotion={reduceMotion}>
            {expandedText}
          </SidebarLabel>
        )
      ) : null}
      {collapsed ? (
        <span className={vaultRailTooltipClassName}>{tooltip}</span>
      ) : null}
    </Link>
  );
}

const themeCycle: ThemePreference[] = ["light", "dark", "system"];

function themePreferenceLabel(preference: ThemePreference) {
  if (preference === "light") {
    return "Light";
  }
  if (preference === "dark") {
    return "Dark";
  }
  return "System";
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
  const { preference, resolved, setPreference } = useTheme();
  const { setPreferences } = usePreferences();
  const appearanceLabel = collapsed
    ? `Appearance · ${themePreferenceLabel(preference)}`
    : "Appearance";

  async function cycleTheme() {
    const index = themeCycle.indexOf(preference);
    const next = themeCycle[(index + 1) % themeCycle.length] ?? "system";
    setPreference(next);
    const { data } = await updatePreferencesRequest({
      theme: preferenceToPrismaTheme(next),
    });
    if (data?.ok) {
      setPreferences(data.preferences);
    }
  }

  const ThemeIcon =
    preference === "system" ? Monitor : resolved === "light" ? Moon : Sun;

  return (
    <button
      type="button"
      aria-label={`${appearanceLabel}. Click to change theme.`}
      onClick={() => void cycleTheme()}
      className={cn(
        "group relative transition-colors duration-200",
        collapsed ? "flex" : undefined,
        railRowClassName(collapsed),
        vaultActionFocus,
        vaultRailIdle,
      )}
    >
      {collapsed ? (
        <ThemeIcon aria-hidden className={railIconClassName} />
      ) : (
        <ThemeIcon aria-hidden className={railExpandedIconClassName} />
      )}
      {!collapsed ? (
        <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
          <SidebarLabel visible={expanded} reduceMotion={reduceMotion}>
            Appearance
          </SidebarLabel>
          <span className="shrink-0 text-[0.6875rem] text-mv-faint">
            {themePreferenceLabel(preference)}
          </span>
        </div>
      ) : null}
      {collapsed ? (
        <span className={vaultRailTooltipClassName}>{appearanceLabel}</span>
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
        "group relative transition-colors duration-200 hover:bg-mv-panel",
        vaultActionFocus,
        collapsed ? "flex" : undefined,
        railRowClassName(collapsed),
        !collapsed && "mb-4",
      )}
    >
      {collapsed ? (
        <span
          aria-hidden
          className="flex size-8 items-center justify-center rounded-full bg-primary text-[0.68rem] font-medium text-primary-foreground"
        >
          {initials}
        </span>
      ) : (
        <>
          <span
            aria-hidden
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-[0.75rem] font-medium leading-none text-primary-foreground"
          >
            {initials}
          </span>
          <SidebarLabel visible={expanded} reduceMotion={reduceMotion}>
            {displayName}
          </SidebarLabel>
        </>
      )}
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

  return (
    <aside
      className={cn(
        "hidden shrink-0 md:flex md:items-stretch md:py-2",
        collapsed ? "w-[4.5rem] justify-center" : "w-[15rem]",
      )}
      style={{ transition: widthTransition }}
    >
      <div
        className={cn(
          vaultSidebarRailClassName,
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

        <nav
          aria-label="Primary"
          className={cn(
            railStackClassName(collapsed),
            "min-h-0 flex-1 overflow-y-auto overscroll-contain",
            !collapsed && "pr-0.5",
          )}
        >
          {vaultSidebarPrimaryNav.map((item) => (
            <SidebarNavLink
              key={item.href}
              item={item}
              active={isVaultNavActive(pathname, item.href)}
              collapsed={collapsed}
              expanded={expanded}
              reduceMotion={reduceMotion}
            />
          ))}
        </nav>

        <div className={cn("mt-2 w-full", collapsed ? "px-0" : "px-0.5")}>
          <SidebarNavLink
            item={vaultSidebarCaptureNav}
            active={isVaultNavActive(pathname, vaultSidebarCaptureNav.href)}
            collapsed={collapsed}
            expanded={expanded}
            reduceMotion={reduceMotion}
            className={vaultCaptureNavClassName}
          />
        </div>

        <div className="mt-auto w-full shrink-0 border-t border-border/60 pt-3">
          <div className={cn(railStackClassName(collapsed), !collapsed && "gap-0.5")}>
            <ThemeToggleRow
              collapsed={collapsed}
              expanded={expanded}
              reduceMotion={reduceMotion}
            />
            {vaultSidebarUtilityNav.map((item) => (
              <SidebarNavLink
                key={item.href}
                item={item}
                active={isVaultNavActive(pathname, item.href)}
                collapsed={collapsed}
                expanded={expanded}
                reduceMotion={reduceMotion}
              />
            ))}
          </div>
          <SidebarProfile
            collapsed={collapsed}
            expanded={expanded}
            reduceMotion={reduceMotion}
          />
        </div>
      </div>
    </aside>
  );
}
