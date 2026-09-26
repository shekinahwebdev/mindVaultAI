import type { LucideIcon } from "lucide-react";
import {
  FolderOpen,
  LayoutDashboard,
  MessageSquare,
  Search,
  Settings,
  StickyNote,
} from "lucide-react";

import { vaultRoutes } from "@/lib/routes";

export type VaultNavItem = {
  label: string;
  /** Wider sidebar label (desktop expanded rail). */
  expandedLabel?: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
};

export const vaultSidebarPrimaryNav: VaultNavItem[] = [
  {
    label: "Overview",
    expandedLabel: "Dashboard",
    href: vaultRoutes.dashboard,
    icon: LayoutDashboard,
  },
  {
    label: "Notes",
    expandedLabel: "All Notes",
    href: vaultRoutes.notes,
    icon: StickyNote,
  },
  {
    label: "Categories",
    href: vaultRoutes.categories,
    icon: FolderOpen,
  },
  { label: "Search", href: vaultRoutes.search, icon: Search },
  {
    label: "AI Chat",
    href: vaultRoutes.chat,
    icon: MessageSquare,
    badge: "Beta",
  },
];

export const vaultSidebarUtilityNav: VaultNavItem[] = [
  { label: "Settings", href: vaultRoutes.settings, icon: Settings },
];

export const vaultSidebarNav: VaultNavItem[] = [
  ...vaultSidebarPrimaryNav,
  ...vaultSidebarUtilityNav,
];

export const vaultHeaderNav: Array<{ label: string; href: string }> = [
  { label: "Overview", href: vaultRoutes.dashboard },
  { label: "Notes", href: vaultRoutes.notes },
  { label: "Categories", href: vaultRoutes.categories },
  { label: "Chat", href: vaultRoutes.chat },
];

export function isVaultNavActive(pathname: string, href: string) {
  return (
    pathname === href ||
    (href !== vaultRoutes.dashboard && pathname.startsWith(`${href}/`))
  );
}

export const vaultMobilePrimaryNav = [
  { label: "Home", href: vaultRoutes.dashboard, icon: LayoutDashboard },
  { label: "Notes", href: vaultRoutes.notes, icon: StickyNote },
  { label: "Search", href: vaultRoutes.search, icon: Search },
] as const;
