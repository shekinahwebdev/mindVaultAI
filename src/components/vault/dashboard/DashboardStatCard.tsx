"use client";

import { motion, useReducedMotion } from "framer-motion";

import type { DashboardStatCard as StatCard } from "@/lib/vault/dashboard-data";
import { cn } from "@/lib/utils";

import { dashboardStatCardClassName } from "./dashboard-ui";
import { vaultEase } from "../vault-motion";

type DashboardStatCardProps = {
  stat: StatCard;
  index?: number;
  variant?: "default" | "hero";
};

export function DashboardStatCard({
  stat,
  index = 0,
  variant = "default",
}: DashboardStatCardProps) {
  const reduceMotion = useReducedMotion();
  const Icon = stat.icon;
  const isHero = variant === "hero";

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.22,
        delay: reduceMotion ? 0 : index * 0.04,
        ease: vaultEase,
      }}
      className={cn(
        dashboardStatCardClassName,
        "min-w-0",
        isHero && "justify-between",
      )}
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="flex size-7 items-center justify-center rounded-[8px] border border-border bg-surface">
          <Icon aria-hidden className="size-[1.05rem] stroke-[1.75]" />
        </span>
        <span className="truncate text-[0.8125rem] font-medium">{stat.label}</span>
      </div>
      <p
        className={cn(
          "mt-1.5 font-semibold leading-none tracking-[-0.03em] text-foreground",
          isHero
            ? "text-[1.75rem] sm:text-[2rem]"
            : "text-[1.125rem] sm:text-[1.25rem]",
        )}
      >
        {stat.value.toLocaleString()}
      </p>
      {isHero ? (
        <p className="mt-1 text-[0.8125rem] text-mv-faint">In your vault</p>
      ) : null}
    </motion.article>
  );
}
