import type { LucideIcon } from "lucide-react";
import {
  FolderOpen,
  LayoutDashboard,
  MessageSquare,
  Plus,
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
    label: "Dashboard",
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
    label: "Ask MindVault",
    expandedLabel: "Ask MindVault",
    href: vaultRoutes.chat,
    icon: MessageSquare,
  },
];

export const vaultSidebarCaptureNav: VaultNavItem = {
  label: "Add to Vault",
  href: vaultRoutes.capture,
  icon: Plus,
};

export const vaultSidebarUtilityNav: VaultNavItem[] = [
  { label: "Settings", href: vaultRoutes.settings, icon: Settings },
];

export const vaultSidebarNav: VaultNavItem[] = [
  ...vaultSidebarPrimaryNav,
  vaultSidebarCaptureNav,
  ...vaultSidebarUtilityNav,
];

export const vaultHeaderNav: Array<{ label: string; href: string }> = [
  { label: "Dashboard", href: vaultRoutes.dashboard },
  { label: "Notes", href: vaultRoutes.notes },
  { label: "Categories", href: vaultRoutes.categories },
  { label: "Ask MindVault", href: vaultRoutes.chat },
];

export function isVaultNavActive(pathname: string, href: string) {
  if (href === vaultRoutes.dashboard) {
    return pathname === href;
  }

  if (href === vaultRoutes.settings) {
    return (
      pathname === href ||
      pathname.startsWith(`${vaultRoutes.settings}/`)
    );
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export const vaultMobilePrimaryNav = [
  { label: "Home", href: vaultRoutes.dashboard, icon: LayoutDashboard },
  { label: "Notes", href: vaultRoutes.notes, icon: StickyNote },
  { label: "Search", href: vaultRoutes.search, icon: Search },
] as const;
