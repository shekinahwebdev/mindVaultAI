"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useCallback, useId, useState } from "react";

import { MindVaultHeroCompanion } from "@/components/vault/MindVaultHeroCompanion";
import { usePreferences } from "@/lib/settings/preferences-context";
import { vaultRoutes } from "@/lib/routes";
import { cn } from "@/lib/utils";

import {
  VaultGreetingBubble,
  VaultThoughtBubbleTail,
  vaultDashboardGreetingMessage,
} from "./VaultThoughtBubble";

type DashboardGreetingMascotProps = {
  className?: string;
};

/**
 * Robot + persistent greeting bubble in a fixed footprint so layout never shifts.
 * Bubble is anchored to the robot inside this wrapper (not the page).
 */
export function DashboardGreetingMascot({ className }: DashboardGreetingMascotProps) {
  const [hovered, setHovered] = useState(false);
  const systemReducedMotion = useReducedMotion();
  const { preferences } = usePreferences();
  const reduceMotion = Boolean(preferences.reducedMotion || systemReducedMotion);
  const bubbleId = useId();

  const openHover = useCallback(() => setHovered(true), []);
  const closeHover = useCallback(() => setHovered(false), []);

  return (
    <motion.div
      className={cn(
        "dashboard-greeting-mascot relative mx-auto w-full max-w-[min(100%,21rem)] shrink-0",
        "flex flex-col items-center gap-1 max-sm:pb-0.5 sm:mx-0 sm:block sm:gap-0",
        "sm:h-[12.5rem] sm:w-[19rem] md:h-[13.25rem] md:w-[20.5rem]",
        className,
      )}
      animate={reduceMotion ? undefined : { y: [0, -5, 0] }}
      transition={{
        duration: 4.2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <div
        className={cn(
          "z-10 w-full max-w-[15rem] px-1",
          "max-sm:relative",
          "sm:absolute sm:top-0 sm:left-0 sm:w-[15rem]",
        )}
      >
        <VaultGreetingBubble id={bubbleId} />
      </div>

      <VaultThoughtBubbleTail
        variant="to-robot-below"
        className="z-[4] max-sm:relative sm:absolute sm:hidden"
      />
      <VaultThoughtBubbleTail
        variant="to-robot-left"
        className={cn(
          "z-[4] hidden sm:absolute sm:flex",
          "top-[4.25rem] left-[7.75rem] md:top-[4.5rem] md:left-[8.25rem]",
        )}
      />

      <Link
        href={vaultRoutes.capture}
        className={cn(
          "relative z-[5] inline-flex shrink-0 rounded-[var(--mv-radius-control)] text-foreground",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "motion-safe:transition-[filter,transform] active:scale-[0.98]",
          "max-sm:order-last",
          "sm:absolute sm:right-0 sm:bottom-0",
          hovered && "brightness-105",
        )}
        aria-label={`${vaultDashboardGreetingMessage} Open capture.`}
        aria-describedby={bubbleId}
        onMouseEnter={openHover}
        onMouseLeave={closeHover}
        onFocus={openHover}
        onBlur={closeHover}
      >
        <MindVaultHeroCompanion active={hovered} />
      </Link>
    </motion.div>
  );
}
