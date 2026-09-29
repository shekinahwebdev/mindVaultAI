import type { LucideIcon } from "lucide-react";
import {
  Archive,
  Code2,
  FolderOpen,
  LayoutDashboard,
  Link2,
  MessageSquare,
  Plus,
  Quote,
  Search,
  Settings,
  StickyNote,
  Tag,
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

/** Main sidebar list — matches product reference order. */
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
  {
    label: "Tags",
    href: vaultRoutes.tags,
    icon: Tag,
  },
  { label: "Search", href: vaultRoutes.search, icon: Search },
  {
    label: "AI Chat",
    href: vaultRoutes.chat,
    icon: MessageSquare,
    badge: "Beta",
  },
  {
    label: "Links",
    expandedLabel: "Saved Links",
    href: vaultRoutes.links,
    icon: Link2,
  },
  {
    label: "Quotes",
    href: vaultRoutes.quotes,
    icon: Quote,
  },
  {
    label: "Code",
    expandedLabel: "Code Snippets",
    href: vaultRoutes.code,
    icon: Code2,
  },
  {
    label: "Archive",
    href: vaultRoutes.archive,
    icon: Archive,
  },
  {
    label: "Settings",
    href: vaultRoutes.settings,
    icon: Settings,
  },
];

export const vaultSidebarCaptureNav: VaultNavItem = {
  label: "Add to Vault",
  href: vaultRoutes.capture,
  icon: Plus,
};

/** Footer utilities (appearance) — settings live in primary nav. */
export const vaultSidebarUtilityNav: VaultNavItem[] = [];

export const vaultSidebarNav: VaultNavItem[] = [
  ...vaultSidebarPrimaryNav,
  vaultSidebarCaptureNav,
  ...vaultSidebarUtilityNav,
];

export const vaultHeaderNav: Array<{ label: string; href: string }> = [
  { label: "Dashboard", href: vaultRoutes.dashboard },
  { label: "Notes", href: vaultRoutes.notes },
  { label: "Categories", href: vaultRoutes.categories },
  { label: "AI Chat", href: vaultRoutes.chat },
];

export function isVaultNavActive(pathname: string, href: string) {
  if (href === vaultRoutes.dashboard) {
    return pathname === href;
  }

  if (href === vaultRoutes.settings) {
    return pathname === href || pathname.startsWith(`${vaultRoutes.settings}/`);
  }

  if (href === vaultRoutes.notes) {
    return (
      pathname === vaultRoutes.notes ||
      pathname.startsWith(`${vaultRoutes.notes}/`)
    );
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export const vaultMobilePrimaryNav = [
  { label: "Home", href: vaultRoutes.dashboard, icon: LayoutDashboard },
  { label: "Notes", href: vaultRoutes.notes, icon: StickyNote },
  { label: "Search", href: vaultRoutes.search, icon: Search },
] as const;
