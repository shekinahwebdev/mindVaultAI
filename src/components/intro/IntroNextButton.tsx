"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { useIdentityIntroInstant, useIntroInstant } from "./IntroPlayback";
import { introTimings, introTransition } from "./intro-motion";

type IntroNextButtonProps = {
  onNext?: () => void;
  immediate?: boolean;
  appearDelay?: number;
  disabled?: boolean;
  /** Use Screen 1's own entrance timing instead of the shared one-shot skip. */
  identity?: boolean;
  compact?: boolean;
};

export function IntroNextButton({
  onNext,
  immediate = false,
  appearDelay,
  disabled,
  identity = false,
  compact = false,
}: IntroNextButtonProps) {
  const reduceMotion = useReducedMotion();
  const sharedInstant = useIntroInstant();
  const identityInstant = useIdentityIntroInstant();
  const instant = identity ? identityInstant : sharedInstant;
  const skipDelay = instant || (immediate && appearDelay === undefined);

  return (
    <motion.button
      type="button"
      onClick={onNext}
      disabled={disabled}
      className={`group relative inline-flex min-h-11 items-center gap-2.5 overflow-hidden rounded-full border border-white/28 bg-transparent px-7 py-2.5 text-[0.8rem] tracking-[0.22em] text-white uppercase disabled:pointer-events-none disabled:opacity-40 sm:px-8 ${
        compact ? "mt-4 sm:mt-5" : "mt-10 sm:mt-12"
      }`}
      initial={skipDelay ? false : { opacity: 0, y: 14 }}
      animate={{
        opacity: 1,
        y: 0,
        boxShadow: reduceMotion
          ? "0 0 0 rgba(255,255,255,0)"
          : [
              "0 0 18px rgba(255,255,255,0.04)",
              "0 0 28px rgba(255,255,255,0.1)",
              "0 0 18px rgba(255,255,255,0.04)",
            ],
      }}
      transition={{
        ...introTransition(
          immediate
            ? { duration: 0.45, delay: appearDelay ?? 0.08 }
            : introTimings.button,
          skipDelay && !immediate && appearDelay === undefined,
        ),
        boxShadow: reduceMotion
          ? { duration: 0 }
          : {
              duration: 3.4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: skipDelay
                ? 0
                : introTimings.button.delay + introTimings.button.duration,
            },
      }}
      whileHover={
        reduceMotion
          ? undefined
          : { scale: 1.025, borderColor: "rgba(255,255,255,0.36)" }
      }
      whileTap={reduceMotion ? undefined : { scale: 0.98 }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent_35%,rgba(255,255,255,0.12)_48%,transparent_62%)] bg-[length:220%_100%] bg-[position:120%_0] transition-[background-position] duration-700 ease-out group-hover:bg-[position:-20%_0]"
      />
      <span className="relative">Next</span>
      <ArrowRight
        aria-hidden
        className="relative size-3.5 transition-transform duration-300 ease-out group-hover:translate-x-0.5"
      />
    </motion.button>
  );
}
