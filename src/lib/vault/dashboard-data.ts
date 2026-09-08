import type { DashboardStats } from "@/lib/vault/dashboard-queries";

export function buildDashboardStatCards(stats: DashboardStats) {
  return [
    { label: "Total Notes", value: stats.totalNotes },
    { label: "Categories", value: stats.categories },
    { label: "Links Saved", value: stats.links },
    { label: "Quotes Saved", value: stats.quotes },
    { label: "Code Snippets", value: stats.code },
  ] as const;
}
