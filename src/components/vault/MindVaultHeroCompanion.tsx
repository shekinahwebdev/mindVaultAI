"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useId } from "react";

import { usePreferences } from "@/lib/settings/preferences-context";
import { cn } from "@/lib/utils";

import { MindVaultCompanionFallback } from "./MindVaultCompanion";
import { vaultEase } from "./vault-motion";

export const heroCompanionSizeClassName =
  "h-[4.25rem] w-[4.25rem] sm:h-20 sm:w-20 md:h-[6.25rem] md:w-[6.25rem]";

type MindVaultHeroCompanionProps = {
  active?: boolean;
  className?: string;
};

/** Large minimalist robot for the dashboard greeting — float, blink, tilt/wave on interaction. */
export function MindVaultHeroCompanion({
  active = false,
  className,
}: MindVaultHeroCompanionProps) {
  const systemReducedMotion = useReducedMotion();
  const { preferences } = usePreferences();
  const reduceMotion = Boolean(preferences.reducedMotion || systemReducedMotion);
  const clipId = `mv-hero-companion-${useId().replace(/:/g, "")}`;

  if (reduceMotion) {
    return (
      <MindVaultCompanionFallback
        className={cn(heroCompanionSizeClassName, className)}
      />
    );
  }

  return (
    <motion.span
      className={cn("relative inline-flex shrink-0 text-foreground", heroCompanionSizeClassName, className)}
      aria-hidden
      animate={{ y: [0, -5, 0] }}
      transition={{
        duration: 3.6,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <motion.span
        className="block size-full"
        animate={{ rotate: active ? 6 : 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 22 }}
      >
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="size-full"
          role="presentation"
        >
          <defs>
            <clipPath id={clipId}>
              <rect x="6" y="5" width="28" height="30" rx="4" />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clipId})`}>
            <rect
              x="11"
              y="24"
              width="18"
              height="11"
              rx="2.5"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <motion.g
              style={{ transformOrigin: "20px 17px" }}
              animate={{ rotate: active ? 4 : 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 26 }}
            >
              <rect
                x="9"
                y="10"
                width="22"
                height="15"
                rx="4"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <line
                x1="20"
                y1="10"
                x2="20"
                y2="6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <circle cx="20" cy="5" r="1.25" fill="currentColor" />
              <motion.ellipse
                cx="16"
                cy="17"
                rx="1.6"
                ry="1.6"
                fill="currentColor"
                style={{ transformOrigin: "16px 17px", transformBox: "fill-box" }}
                animate={{ scaleY: [1, 1, 0.15, 1] }}
                transition={{
                  duration: 0.22,
                  repeat: Infinity,
                  repeatDelay: 3.8,
                  ease: "easeInOut",
                }}
              />
              <motion.ellipse
                cx="24"
                cy="17"
                rx="1.6"
                ry="1.6"
                fill="currentColor"
                style={{ transformOrigin: "24px 17px", transformBox: "fill-box" }}
                animate={{ scaleY: [1, 1, 0.15, 1] }}
                transition={{
                  duration: 0.22,
                  repeat: Infinity,
                  repeatDelay: 3.8,
                  ease: "easeInOut",
                }}
              />
            </motion.g>
            <path
              d="M11 26v-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle cx="11" cy="21" r="1.35" fill="currentColor" />
            <motion.g
              style={{ transformOrigin: "29px 26px" }}
              animate={{
                rotate: active ? [0, -22, 16, -8, 0] : [0, -6, 4, 0],
              }}
              transition={
                active
                  ? { duration: 0.85, ease: vaultEase }
                  : {
                      duration: 4.5,
                      repeat: Infinity,
                      repeatDelay: 2,
                      ease: "easeInOut",
                    }
              }
            >
              <path
                d="M29 26v-7"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <circle cx="29" cy="17.5" r="1.35" fill="currentColor" />
            </motion.g>
          </g>
        </svg>
      </motion.span>
    </motion.span>
  );
}
