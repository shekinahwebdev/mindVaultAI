"use client";

import { motion, useReducedMotion } from "framer-motion";

import type { DashboardStatCard as StatCard } from "@/lib/vault/dashboard-data";
import { cn } from "@/lib/utils";

import { dashboardStatCardClassName } from "./dashboard-ui";
import { vaultEase } from "../vault-motion";

type DashboardStatCardProps = {
  stat: StatCard;
  index?: number;
  variant?: "default" | "hero" | "compact" | "summary";
};

export function DashboardStatCard({
  stat,
  index = 0,
  variant = "default",
}: DashboardStatCardProps) {
  const reduceMotion = useReducedMotion();
  const Icon = stat.icon;
  const isHero = variant === "hero";
  const isCompact = variant === "compact";
  const isSummary = variant === "summary";

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
        isSummary && "flex-row items-center gap-3 px-4 py-3.5 sm:py-4",
        isHero && "justify-between px-4 py-4 sm:py-5",
        isCompact && "px-3 py-2.5 sm:py-3",
      )}
    >
      {isSummary ? (
        <>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-[var(--mv-radius-control)] border border-border bg-mv-panel text-muted-foreground">
            <Icon aria-hidden className="size-[1.125rem] stroke-[1.75]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.8125rem] font-medium text-muted-foreground">
              {stat.label}
            </p>
            <p className="mt-1 text-[1.375rem] font-semibold leading-none tracking-[-0.03em] text-foreground sm:text-[1.5rem]">
              {stat.value.toLocaleString()}
            </p>
          </div>
        </>
      ) : (
        <>
          <div
            className={cn(
              "flex items-center gap-2 text-muted-foreground",
              isCompact && "gap-1.5",
            )}
          >
            <span
              className={cn(
                "flex shrink-0 items-center justify-center rounded-[var(--mv-radius-control)] border border-border bg-mv-panel",
                isCompact ? "size-6" : "size-7",
              )}
            >
              <Icon
                aria-hidden
                className={cn("stroke-[1.75]", isCompact ? "size-3.5" : "size-[1.05rem]")}
              />
            </span>
            <span
              className={cn(
                "truncate font-medium",
                isCompact ? "text-[0.75rem]" : "text-[0.8125rem]",
              )}
            >
              {stat.label}
            </span>
          </div>
          <p
            className={cn(
              "mt-1.5 font-semibold leading-none tracking-[-0.03em] text-foreground",
              isHero && "text-[1.875rem] sm:text-[2.125rem]",
              isCompact && "mt-1 text-[1.0625rem] sm:text-[1.125rem]",
              !isHero && !isCompact && "text-[1.125rem] sm:text-[1.25rem]",
            )}
          >
            {stat.value.toLocaleString()}
          </p>
          {isHero ? (
            <p className="mt-1.5 text-[0.8125rem] text-muted-foreground">Total in your vault</p>
          ) : null}
        </>
      )}
    </motion.article>
  );
}
