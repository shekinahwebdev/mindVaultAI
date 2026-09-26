"use client";

import { motion, useReducedMotion } from "framer-motion";

import { buildDashboardStatCards } from "@/lib/vault/dashboard-data";
import type { DashboardStats as DashboardStatsData } from "@/lib/vault/dashboard-queries";
import { cn } from "@/lib/utils";

import { vaultEase } from "../vault-motion";
import { dashboardBentoMiniStatClassName, dashboardBentoTotalClassName } from "./dashboard-ui";

type DashboardBentoStatsProps = {
  stats: DashboardStatsData;
  className?: string;
};

export function DashboardBentoStats({ stats, className }: DashboardBentoStatsProps) {
  const reduceMotion = useReducedMotion();
  const [primary, ...secondary] = buildDashboardStatCards(stats);
  const PrimaryIcon = primary.icon;

  return (
    <div className={cn("grid grid-cols-2 gap-2", className)}>
      {secondary.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.article
            key={stat.label}
            initial={reduceMotion ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.2,
              delay: reduceMotion ? 0 : index * 0.03,
              ease: vaultEase,
            }}
            className={dashboardBentoMiniStatClassName}
          >
            <Icon aria-hidden className="size-4 stroke-[1.75] text-muted-foreground" />
            <p className="mt-2 text-[1.25rem] font-semibold leading-none tabular-nums tracking-[-0.03em] text-foreground">
              {stat.value.toLocaleString()}
            </p>
            <p className="mt-1 truncate text-[0.6875rem] font-medium text-muted-foreground">
              {stat.label}
            </p>
          </motion.article>
        );
      })}
      <motion.article
        initial={reduceMotion ? false : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: reduceMotion ? 0 : 0.12, ease: vaultEase }}
        className={cn(dashboardBentoTotalClassName, "col-span-2")}
      >
        <PrimaryIcon aria-hidden className="size-5 stroke-[1.75] text-muted-foreground" />
        <div className="mt-2 flex items-baseline gap-2">
          <p className="text-[2rem] font-semibold leading-none tabular-nums tracking-[-0.04em] text-foreground">
            {primary.value.toLocaleString()}
          </p>
          <p className="text-[0.8125rem] font-medium text-muted-foreground">
            {primary.label}
          </p>
        </div>
        <p className="mt-1 text-[0.75rem] text-mv-faint">In your vault</p>
      </motion.article>
    </div>
  );
}
