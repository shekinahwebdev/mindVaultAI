"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

import { vaultEase } from "../vault-motion";

export const vaultDashboardGreetingMessage =
  "Welcome back! What's on your mind today?";

type VaultGreetingBubbleProps = {
  message?: string;
  id?: string;
  className?: string;
};

/** Persistent dashboard greeting bubble — dark surface, thin border. */
export function VaultGreetingBubble({
  message = vaultDashboardGreetingMessage,
  id,
  className,
}: VaultGreetingBubbleProps) {
  return (
    <div
      id={id}
      role="status"
      className={cn(
        "max-w-[15rem] rounded-2xl border border-border bg-surface px-4 py-3",
        "text-pretty text-[0.8125rem] leading-snug text-foreground",
        "shadow-[var(--mv-shadow-elevated)] sm:text-[0.875rem]",
        className,
      )}
    >
      {message}
    </div>
  );
}

type VaultThoughtBubbleTailProps = {
  /** Tail points from bubble toward the mascot head. */
  variant: "to-robot-below" | "to-robot-left";
  className?: string;
};

const tailDots = [
  "size-2 border border-border/80 bg-surface",
  "size-1.5 border border-border/85 bg-surface",
] as const;

export function VaultThoughtBubbleTail({
  variant,
  className,
}: VaultThoughtBubbleTailProps) {
  const toRobotBelow = variant === "to-robot-below";

  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none flex shrink-0 items-center justify-center gap-1.25",
        toRobotBelow
          ? "flex-col pt-0.5"
          : "flex-col items-end gap-1 py-0.5 pl-1",
        className,
      )}
    >
      {tailDots.map((dotClass) => (
        <motion.span
          key={dotClass}
          className={cn("rounded-full", dotClass)}
          initial={false}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.18, ease: vaultEase }}
        />
      ))}
    </span>
  );
}
