"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useCallback, useState } from "react";

import {
  heroCompanionSizeClassName,
  MindVaultHeroCompanion,
} from "@/components/vault/MindVaultHeroCompanion";
import { usePreferences } from "@/lib/settings/preferences-context";
import { vaultRoutes } from "@/lib/routes";
import { cn } from "@/lib/utils";

import { vaultEase } from "../vault-motion";

type DashboardGreetingMascotProps = {
  firstName: string;
};

export function DashboardGreetingMascot({ firstName }: DashboardGreetingMascotProps) {
  const [peek, setPeek] = useState(false);
  const systemReducedMotion = useReducedMotion();
  const { preferences } = usePreferences();
  const reduceMotion = Boolean(preferences.reducedMotion || systemReducedMotion);

  const showBubble = peek;
  const bubbleMessage = `Hello ${firstName}! Have anything to save?`;

  const openPeek = useCallback(() => setPeek(true), []);
  const closePeek = useCallback(() => setPeek(false), []);

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 align-bottom",
        heroCompanionSizeClassName,
      )}
    >
      <motion.span
        role="tooltip"
        aria-hidden={!showBubble}
        initial={false}
        animate={
          reduceMotion
            ? { opacity: showBubble ? 1 : 0 }
            : { opacity: showBubble ? 1 : 0, y: showBubble ? 0 : 6, scale: showBubble ? 1 : 0.96 }
        }
        transition={{ duration: 0.2, ease: vaultEase }}
        className={cn(
          "pointer-events-none absolute z-20 w-max max-w-[min(16rem,calc(100vw-2rem))]",
          "bottom-[calc(100%+0.35rem)] max-sm:right-0 sm:left-1/2 sm:-translate-x-1/2",
          showBubble ? "visible" : "invisible",
        )}
      >
        <span
          className={cn(
            "relative block rounded-[var(--mv-radius-control)] border border-border",
            "bg-surface px-3 py-2 text-[0.75rem] leading-snug text-foreground",
            "shadow-[var(--mv-shadow-elevated)] sm:text-[0.8125rem]",
            "max-sm:text-right",
          )}
        >
          {bubbleMessage}
          <span
            aria-hidden
            className={cn(
              "absolute top-full size-2.5 rotate-45 border-r border-b border-border bg-surface",
              "max-sm:right-4 sm:left-1/2 sm:-translate-x-1/2",
            )}
          />
        </span>
      </motion.span>

      <Link
        href={vaultRoutes.capture}
        className={cn(
          "relative inline-flex rounded-[var(--mv-radius-control)] text-foreground",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "active:scale-[0.98] motion-safe:transition-transform",
        )}
        aria-label={`${bubbleMessage} Open capture.`}
        onMouseEnter={openPeek}
        onMouseLeave={closePeek}
        onFocus={openPeek}
        onBlur={closePeek}
      >
        <MindVaultHeroCompanion active={peek} />
      </Link>
    </span>
  );
}
