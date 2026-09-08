"use client";

import { motion } from "framer-motion";

import { buildDashboardStatCards } from "@/lib/vault/dashboard-data";
import type { DashboardStats } from "@/lib/vault/dashboard-queries";

import { vaultEase } from "../vault-motion";

type DashboardStatsProps = {
  stats: DashboardStats;
};

export function DashboardStats({ stats }: DashboardStatsProps) {
  const statCards = buildDashboardStatCards(stats);

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {statCards.map((stat, index) => (
        <motion.article
          key={stat.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            delay: index * 0.05,
            ease: vaultEase,
          }}
          className="rounded-2xl border border-white/[0.08] bg-white/[0.025] px-4 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.18)]"
        >
          <p className="text-[0.68rem] tracking-[0.14em] text-white/40 uppercase">
            {stat.label}
          </p>
          <p className="mt-3 font-editorial text-[1.75rem] leading-none text-brand-ink italic">
            {stat.value.toLocaleString()}
          </p>
        </motion.article>
      ))}
    </div>
  );
}
