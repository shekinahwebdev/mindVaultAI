import type { Transition } from "framer-motion";

export const introEase = [0.16, 1, 0.3, 1] as const;
export const signatureEase = [0.33, 0.08, 0.18, 1] as const;

export const introTimings = {
  page: { duration: 0.85, delay: 0 },
  logo: { duration: 1.05, delay: 0.28 },
  signature: { duration: 1.9, delay: 1.1 },
  tagline: { duration: 0.76, delay: 2.75 },
  supporting: { duration: 0.76, delay: 3.25 },
  button: { duration: 0.68, delay: 3.85 },
} as const;

export function introTransition(
  timing: { duration: number; delay: number },
  reduceMotion: boolean | null,
  extras?: Transition,
): Transition {
  if (reduceMotion) {
    return { duration: 0, delay: 0 };
  }

  return {
    duration: timing.duration,
    delay: timing.delay,
    ease: introEase,
    ...extras,
  };
}

export const introSlideTransition = {
  duration: 0.48,
  ease: introEase,
} as const;

export function introSlideVariants(reduceMotion: boolean | null) {
  const distance = reduceMotion ? 0 : 28;

  return {
    enter: (direction: number) => ({
      opacity: 0,
      x: direction * distance,
    }),
    center: {
      opacity: 1,
      x: 0,
    },
    exit: (direction: number) => ({
      opacity: 0,
      x: direction * -18,
    }),
  };
}

