"use client";

import Lottie from "lottie-react";
import { useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

import { usePreferences } from "@/lib/settings/preferences-context";
import { cn } from "@/lib/utils";

import { MindVaultCompanionFallback } from "./MindVaultCompanion";

const ROBOT_ANIMATION_URL = "/animations/mindvault-robot.json";

const robotSizeVariants = {
  /** Inline accent (smaller than title line). */
  inline:
    "relative -top-0.5 inline-flex h-[1.55em] w-[1.55em] min-h-10 min-w-10 shrink-0 align-middle sm:min-h-11 sm:min-w-11",
  /** Dashboard greeting — taller than the title line (~30–34px type). */
  hero: "relative inline-flex h-16 w-16 shrink-0 sm:h-[4.75rem] sm:w-[4.75rem]",
} as const;

type MindVaultRobotProps = {
  className?: string;
  variant?: keyof typeof robotSizeVariants;
};

/**
 * Decorative Lottie robot beside the dashboard greeting.
 * Asset: public/animations/mindvault-robot.json (see public/animations/README.md).
 */
export function MindVaultRobot({
  className,
  variant = "inline",
}: MindVaultRobotProps) {
  const robotSizeClassName = robotSizeVariants[variant];
  const systemReducedMotion = useReducedMotion();
  const { preferences } = usePreferences();
  const reduceMotion = preferences.reducedMotion || systemReducedMotion;

  const [animationData, setAnimationData] = useState<object | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (reduceMotion) {
      return;
    }

    let cancelled = false;

    void fetch(ROBOT_ANIMATION_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error("animation fetch failed");
        }
        return response.json() as Promise<object>;
      })
      .then((data) => {
        if (!cancelled) {
          setAnimationData(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadFailed(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [reduceMotion]);

  if (reduceMotion || loadFailed) {
    return (
      <MindVaultCompanionFallback className={cn(robotSizeClassName, className)} />
    );
  }

  return (
    <span
      className={cn(robotSizeClassName, className)}
      aria-hidden
    >
      {animationData ? (
        <Lottie
          animationData={animationData}
          loop
          autoplay
          className="size-full"
          rendererSettings={{ preserveAspectRatio: "xMidYMid meet" }}
        />
      ) : (
        <span className="block size-full animate-pulse rounded-[var(--mv-radius-control)] bg-mv-panel/50" />
      )}
    </span>
  );
}
