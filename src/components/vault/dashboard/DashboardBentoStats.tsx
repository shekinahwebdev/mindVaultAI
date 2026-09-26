"use client";

import { motion, useReducedMotion } from "framer-motion";

import { buildDashboardStatCards } from "@/lib/vault/dashboard-data";
import type { DashboardStats as DashboardStatsData } from "@/lib/vault/dashboard-queries";
import { cn } from "@/lib/utils";

import { vaultEase } from "../vault-motion";
import {
  dashboardBentoCellClassName,
  dashboardBentoMiniStatClassName,
  dashboardBentoTotalClassName,
} from "./dashboard-ui";

type DashboardBentoStatsProps = {
  stats: DashboardStatsData;
  className?: string;
};

export function DashboardBentoStats({ stats, className }: DashboardBentoStatsProps) {
  const reduceMotion = useReducedMotion();
  const [primary, ...secondary] = buildDashboardStatCards(stats);
  const PrimaryIcon = primary.icon;

  return (
    <section
      className={cn(
        dashboardBentoCellClassName,
        "flex min-h-0 w-full flex-col gap-2 p-2",
        className,
      )}
    >
      <motion.article
        initial={reduceMotion ? false : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: vaultEase }}
        className={cn(
          dashboardBentoTotalClassName,
          "shrink-0 border-0 bg-mv-panel/40 py-3 shadow-none",
        )}
      >
        <div className="flex items-center gap-2.5">
          <PrimaryIcon aria-hidden className="size-5 shrink-0 stroke-[1.75] text-muted-foreground" />
          <div className="min-w-0">
            <p className="text-[1.5rem] font-semibold leading-none tabular-nums tracking-[-0.04em] text-foreground">
              {primary.value.toLocaleString()}
            </p>
            <p className="mt-1 text-[0.75rem] font-medium text-muted-foreground">
              {primary.label} · In your vault
            </p>
          </div>
        </div>
      </motion.article>

      <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-2">
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
              className={cn(
                dashboardBentoMiniStatClassName,
                "h-full min-h-0 justify-center border-0 bg-mv-panel/40 px-3 py-3 shadow-none",
              )}
            >
              <Icon aria-hidden className="size-4 stroke-[1.75] text-muted-foreground" />
              <p className="mt-2 text-[1.25rem] font-semibold leading-none tabular-nums tracking-[-0.03em] text-foreground">
                {stat.value.toLocaleString()}
              </p>
              <p className="mt-1 truncate text-[0.75rem] font-medium text-muted-foreground">
                {stat.label}
              </p>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
