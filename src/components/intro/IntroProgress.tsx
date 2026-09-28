"use client";

import { INTRO_STEP_COUNT } from "./intro-flow";

type IntroProgressProps = {
  current: number;
};

export function IntroProgress({ current }: IntroProgressProps) {
  return (
    <div
      className="flex items-center gap-3"
      role="img"
      aria-label={`Onboarding step ${current + 1} of ${INTRO_STEP_COUNT}`}
    >
      <span className="text-[0.6875rem] font-medium tabular-nums tracking-wide text-white/40">
        {current + 1} / {INTRO_STEP_COUNT}
      </span>
      {Array.from({ length: INTRO_STEP_COUNT }, (_, index) => {
        const active = index === current;

        return (
          <span
            key={index}
            aria-hidden
            className={
              active
                ? "size-1.5 rounded-full bg-white"
                : "size-1.5 rounded-full border border-white/35 bg-transparent"
            }
          />
        );
      })}
    </div>
  );
}
