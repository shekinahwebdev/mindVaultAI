"use client";

import { motion, type MotionProps } from "framer-motion";

import { cn } from "@/lib/utils";

import { vaultEase } from "../vault-motion";

type VaultThoughtBubbleProps = {
  line1: string;
  line2: string;
  className?: string;
  motionProps?: Pick<
    MotionProps,
    "id" | "initial" | "animate" | "exit" | "transition"
  >;
};

/** Comic-inspired thought bubble — two stacked lines, oval body. */
export function VaultThoughtBubble({
  line1,
  line2,
  className,
  motionProps,
}: VaultThoughtBubbleProps) {
  return (
    <motion.div
      role="status"
      className={cn(
        "relative max-w-[min(18rem,calc(100vw-2.5rem))] rounded-[1.75rem] border-2 border-foreground/85",
        "bg-surface px-4 py-3 text-center shadow-[var(--mv-shadow-elevated)]",
        "sm:max-w-[14.5rem] sm:px-5 sm:py-3.5",
        className,
      )}
      {...motionProps}
    >
      <p className="text-pretty text-[0.8125rem] font-semibold leading-tight tracking-tight text-foreground sm:text-[0.875rem]">
        <span className="block">{line1}</span>
        <span className="mt-1 block text-[0.75rem] font-medium text-muted-foreground sm:text-[0.8125rem]">
          {line2}
        </span>
      </p>
    </motion.div>
  );
}

type VaultThoughtBubbleTailProps = {
  /** Tail points from bubble toward the mascot (robot). */
  layout: "vertical-up" | "horizontal-right";
  visible?: boolean;
  className?: string;
};

const tailDots = [
  "size-2.5 border-2 border-foreground/70 bg-surface",
  "size-2 border-2 border-foreground/75 bg-surface",
  "size-1.5 border-2 border-foreground/80 bg-surface",
] as const;

export function VaultThoughtBubbleTail({
  layout,
  visible = true,
  className,
}: VaultThoughtBubbleTailProps) {
  const isVertical = layout === "vertical-up";

  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none flex shrink-0 items-center justify-center gap-1.5",
        "transition-opacity duration-200",
        isVertical ? "flex-col-reverse py-0.5" : "flex-row px-0.5",
        visible ? "opacity-100" : "opacity-0",
        className,
      )}
    >
      {tailDots.map((dotClass, index) => (
        <motion.span
          key={dotClass}
          className={cn("rounded-full", dotClass)}
          initial={false}
          animate={{ scale: visible ? 1 : 0.6, opacity: visible ? 1 : 0 }}
          transition={{ duration: 0.18, delay: visible ? index * 0.04 : 0, ease: vaultEase }}
        />
      ))}
    </span>
  );
}
