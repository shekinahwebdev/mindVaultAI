"use client";

import { buildDashboardSummaryStats } from "@/lib/vault/dashboard-data";
import type { DashboardStats as DashboardStatsData } from "@/lib/vault/dashboard-queries";
import { cn } from "@/lib/utils";

import { DashboardStatCard } from "./DashboardStatCard";

type DashboardStatsProps = {
  stats: DashboardStatsData;
  className?: string;
};

export function DashboardStats({ stats, className }: DashboardStatsProps) {
  const summaryStats = buildDashboardSummaryStats(stats);

  return (
    <section
      aria-label="Vault metrics"
      className={cn(
        "grid grid-cols-2 gap-3 min-w-0 sm:gap-3.5 lg:grid-cols-4",
        className,
      )}
    >
      {summaryStats.map((stat, index) => (
        <DashboardStatCard key={stat.label} stat={stat} index={index} variant="summary" />
      ))}
    </section>
  );
}
