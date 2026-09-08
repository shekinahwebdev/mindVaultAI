"use client";

import { INTRO_STEP_COUNT } from "./intro-flow";

type IntroProgressProps = {
  current: number;
};

export function IntroProgress({ current }: IntroProgressProps) {
  return (
    <div
      className="flex items-center gap-2.5"
      role="img"
      aria-label={`Intro step ${current + 1} of ${INTRO_STEP_COUNT}`}
    >
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
