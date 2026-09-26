"use client";

import { buildDashboardStatCards } from "@/lib/vault/dashboard-data";
import type { DashboardStats as DashboardStatsData } from "@/lib/vault/dashboard-queries";

import { DashboardStatCard } from "./DashboardStatCard";

type DashboardStatsProps = {
  stats: DashboardStatsData;
};

export function DashboardStats({ stats }: DashboardStatsProps) {
  const [primary, ...secondary] = buildDashboardStatCards(stats);

  return (
    <div className="grid gap-2.5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.45fr)]">
      <DashboardStatCard stat={primary} index={0} variant="hero" />
      <div className="grid min-w-0 grid-cols-2 gap-2.5">
        {secondary.map((stat, index) => (
          <DashboardStatCard key={stat.label} stat={stat} index={index + 1} />
        ))}
      </div>
    </div>
  );
}
