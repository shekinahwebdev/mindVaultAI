"use client";

import { cn } from "@/lib/utils";

import { HeroInteractiveRobot } from "./HeroInteractiveRobot";

export function HeroHumanScene() {
  return (
    <div
      className={cn(
        "landing-hero-scene relative mx-auto w-full max-w-[min(100%,20.5rem)] sm:max-w-[22rem]",
        "px-1 sm:px-2 lg:max-w-[min(100%,30rem)] lg:px-0",
      )}
    >
      <svg
        className="pointer-events-none absolute inset-0 z-[1] h-full w-full overflow-visible opacity-70"
        viewBox="0 0 400 480"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden
      >
        <path
          d="M200 40 Q280 120 300 200"
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="1"
        />
        <path
          d="M120 80 Q200 160 240 260"
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1"
        />
        <path
          d="M200 280 Q260 320 280 380"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
          strokeDasharray="4 6"
        />
      </svg>

      <div
        className={cn(
          "relative z-[2] flex w-full min-h-0 flex-col justify-center overflow-visible",
          "h-[min(24rem,calc(100dvh-21.5rem))] sm:h-[min(26rem,calc(100dvh-20rem))]",
          "lg:h-[min(36.5rem,calc(100dvh-7.5rem))]",
        )}
      >
        <HeroInteractiveRobot className="h-full min-h-0 w-full" />
      </div>
    </div>
  );
}
