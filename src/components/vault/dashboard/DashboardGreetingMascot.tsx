"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useCallback, useId, useState } from "react";

import { MindVaultHeroCompanion } from "@/components/vault/MindVaultHeroCompanion";
import { usePreferences } from "@/lib/settings/preferences-context";
import { vaultRoutes } from "@/lib/routes";
import { cn } from "@/lib/utils";

import { vaultActionFocus } from "../vault-controls";

import {
  VaultGreetingBubble,
  VaultThoughtBubbleTail,
  vaultDashboardGreetingMessage,
} from "./VaultThoughtBubble";

type DashboardGreetingMascotProps = {
  className?: string;
};

/** Compact assistant: short bubble + robot, optional link to AI Chat. */
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
        "dashboard-greeting-mascot relative mx-auto w-full max-w-[20rem] shrink-0",
        "flex items-end justify-center gap-2 sm:mx-0 sm:justify-end sm:gap-2.5",
        className,
      )}
      animate={reduceMotion ? undefined : { y: [0, -3, 0] }}
      transition={{
        duration: 4.2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <div className="relative z-10 flex min-w-0 flex-col items-start gap-1.5 pb-1">
        <VaultGreetingBubble
          id={bubbleId}
          className="max-w-[10.5rem] rounded-xl px-3 py-2 text-[0.75rem] sm:max-w-[11rem] sm:text-[0.8125rem]"
        />
        <Link
          href={vaultRoutes.chat}
          className={cn(
            "text-[0.6875rem] font-medium text-muted-foreground underline-offset-2",
            "hover:text-foreground hover:underline",
            vaultActionFocus,
          )}
        >
          Ask MindVault
        </Link>
        <VaultThoughtBubbleTail
          variant="to-robot-left"
          className="absolute -right-2 bottom-6 hidden sm:flex"
        />
      </div>

      <div
        className="relative z-[5] shrink-0"
        onMouseEnter={openHover}
        onMouseLeave={closeHover}
        onFocus={openHover}
        onBlur={closeHover}
        aria-label={vaultDashboardGreetingMessage}
        aria-describedby={bubbleId}
        role="img"
      >
        <MindVaultHeroCompanion active={hovered} compact />
      </div>
    </motion.div>
  );
}