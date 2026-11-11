"use client";

import { AnimatePresence, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useCallback, useId, useState } from "react";

import { MindVaultHeroCompanion } from "@/components/vault/MindVaultHeroCompanion";
import { usePreferences } from "@/lib/settings/preferences-context";
import { vaultRoutes } from "@/lib/routes";
import { cn } from "@/lib/utils";

import { vaultEase } from "../vault-motion";

import { VaultThoughtBubble, VaultThoughtBubbleTail } from "./VaultThoughtBubble";

type DashboardGreetingMascotProps = {
  firstName: string;
};

export function DashboardGreetingMascot({ firstName }: DashboardGreetingMascotProps) {
  const [peek, setPeek] = useState(false);
  const systemReducedMotion = useReducedMotion();
  const { preferences } = usePreferences();
  const reduceMotion = Boolean(preferences.reducedMotion || systemReducedMotion);
  const bubbleId = useId();

  const showBubble = peek;
  const line1 = `Hello, ${firstName}!`;
  const line2 = "Have anything to save?";
  const ariaMessage = `${line1} ${line2}`;

  const openPeek = useCallback(() => setPeek(true), []);
  const closePeek = useCallback(() => setPeek(false), []);

  const bubbleMotion = reduceMotion
    ? { initial: false as const, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, scale: 0.94 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.96 },
        transition: { duration: 0.22, ease: vaultEase },
      };

  return (
    <span
      className={cn(
        "relative inline-flex max-w-full shrink-0",
        "flex-col-reverse items-end gap-0.5 max-sm:pt-1",
        "sm:flex-row sm:items-center sm:gap-2.5",
      )}
    >
      <AnimatePresence mode="wait">
        {showBubble ? (
          <VaultThoughtBubble
            key="greeting-thought"
            line1={line1}
            line2={line2}
            className="z-10 sm:order-1"
            motionProps={{
              id: bubbleId,
              ...bubbleMotion,
            }}
          />
        ) : null}
      </AnimatePresence>

      <VaultThoughtBubbleTail
        layout="vertical-up"
        visible={showBubble}
        className="z-[5] sm:hidden"
      />
      <VaultThoughtBubbleTail
        layout="horizontal-right"
        visible={showBubble}
        className="z-[5] hidden sm:order-2 sm:flex"
      />

      <Link
        href={vaultRoutes.capture}
        className={cn(
          "relative z-[6] inline-flex shrink-0 rounded-[var(--mv-radius-control)] text-foreground",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "active:scale-[0.98] motion-safe:transition-transform",
          "sm:order-3",
        )}
        aria-label={`${ariaMessage} Open capture.`}
        aria-describedby={showBubble ? bubbleId : undefined}
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
