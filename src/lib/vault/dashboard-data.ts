import type { DashboardStats } from "@/lib/vault/dashboard-queries";

import type { LucideIcon } from "lucide-react";
import { Code2, FileText, FolderOpen, Layers, Link2, Quote } from "lucide-react";

export type DashboardStatCard = {
  label: string;
  value: number;
  icon: LucideIcon;
};

export function buildDashboardStatCards(stats: DashboardStats): DashboardStatCard[] {
  return [
    { label: "Vault Items", value: stats.totalNotes, icon: Layers },
    { label: "Categories", value: stats.categories, icon: FolderOpen },
    { label: "Links", value: stats.links, icon: Link2 },
    { label: "Quotes", value: stats.quotes, icon: Quote },
    { label: "Code Snippets", value: stats.code, icon: Code2 },
  ];
}

/** Top summary row — matches dashboard reference (real counts only). */
export function buildDashboardSummaryStats(stats: DashboardStats): DashboardStatCard[] {
  return [
    { label: "Notes", value: stats.totalNotes, icon: FileText },
    { label: "Categories", value: stats.categories, icon: FolderOpen },
    { label: "Links Saved", value: stats.links, icon: Link2 },
    { label: "Quotes", value: stats.quotes, icon: Quote },
  ];
}

export const dashboardInspirationalQuote = "Small notes create big opportunities.";
