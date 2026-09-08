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
  href: string;
  icon: LucideIcon;
  badge?: string;
};

export const vaultSidebarNav: VaultNavItem[] = [
  { label: "Dashboard", href: vaultRoutes.dashboard, icon: LayoutDashboard },
  { label: "All Notes", href: vaultRoutes.notes, icon: StickyNote },
  { label: "Categories", href: vaultRoutes.categories, icon: FolderOpen },
  { label: "Search", href: vaultRoutes.search, icon: Search },
  {
    label: "AI Chat",
    href: vaultRoutes.chat,
    icon: MessageSquare,
    badge: "Beta",
  },
  { label: "Settings", href: vaultRoutes.settings, icon: Settings },
];

export const vaultMobilePrimaryNav = [
  { label: "Home", href: vaultRoutes.dashboard, icon: LayoutDashboard },
  { label: "Notes", href: vaultRoutes.notes, icon: StickyNote },
  { label: "Search", href: vaultRoutes.search, icon: Search },
] as const;
