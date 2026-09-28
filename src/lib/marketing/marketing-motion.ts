import type { Transition } from "framer-motion";

export const marketingEase = [0.16, 1, 0.3, 1] as const;

export function marketingTransition(
  reduceMotion: boolean | null,
  partial: Transition = {},
): Transition {
  if (reduceMotion) {
    return { duration: 0, delay: 0 };
  }
  return { duration: 0.55, ease: marketingEase, ...partial };
}

export const featuresPageReveal = {
  hidden: { opacity: 0, y: 20 },
  show: (reduceMotion: boolean | null) => ({
    opacity: 1,
    y: 0,
    transition: marketingTransition(reduceMotion, { duration: 0.65, delay: 0.05 }),
  }),
};

export const featuresGridContainer = {
  hidden: { opacity: 0 },
  show: (reduceMotion: boolean | null) => ({
    opacity: 1,
    transition: reduceMotion
      ? { duration: 0 }
      : { staggerChildren: 0.06, delayChildren: 0.22 },
  }),
};

export const featuresGridItem = {
  hidden: { opacity: 0, y: 14, scale: 0.98 },
  show: (reduceMotion: boolean | null) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: marketingTransition(reduceMotion, { duration: 0.42 }),
  }),
};

export const featuresBackdropReveal = {
  hidden: { opacity: 0, scale: 1.04 },
  show: (reduceMotion: boolean | null) => ({
    opacity: 1,
    scale: 1,
    transition: marketingTransition(reduceMotion, { duration: 0.85 }),
  }),
};
