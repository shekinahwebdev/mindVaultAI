"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

type IntroBackButtonProps = {
  onBack: () => void;
  disabled?: boolean;
};

export function IntroBackButton({ onBack, disabled }: IntroBackButtonProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      onClick={onBack}
      disabled={disabled}
      className="inline-flex min-h-10 items-center gap-2 rounded-full px-1 text-[0.72rem] tracking-[0.18em] text-white/55 uppercase transition-colors hover:text-white disabled:pointer-events-none disabled:opacity-40"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <ArrowLeft aria-hidden className="size-3.5" />
      Back
    </motion.button>
  );
}
