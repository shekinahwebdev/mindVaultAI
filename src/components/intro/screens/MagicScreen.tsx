"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

import { IntroNextButton } from "../IntroNextButton";
import { MagicDemo } from "../MagicDemo";
import { introEase, introTransition } from "../intro-motion";
import { magicTimings } from "../magic-demo";

type MagicScreenProps = {
  onNext: () => void;
  disabled?: boolean;
};

const copy = {
  heading: "Save anything.",
  supporting: "MindVault understands what you save and organizes it for you.",
  understood: "MindVault understood it.",
} as const;

function UnderstoodLabel({ instant }: { instant: boolean }) {
  const [visible, setVisible] = useState(instant);

  useEffect(() => {
    if (instant) {
      setVisible(true);
      return;
    }

    const timeout = window.setTimeout(
      () => setVisible(true),
      magicTimings.understood * 1000,
    );
    return () => window.clearTimeout(timeout);
  }, [instant]);

  if (!visible) {
    return <div className="mt-5 h-[1.4rem] sm:mt-6" />;
  }

  return (
    <motion.p
      className="font-editorial mt-5 text-[1.02rem] text-brand-ink italic sm:mt-6 sm:text-[1.08rem]"
      initial={instant ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={introTransition({ duration: 0.7, delay: 0 }, instant)}
    >
      {copy.understood}
    </motion.p>
  );
}

function useSafeReducedMotion() {
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted && reduceMotion === true;
}

export function MagicScreen({ onNext, disabled }: MagicScreenProps) {
  const instant = useSafeReducedMotion();

  return (
    <section className="relative flex w-full max-w-xl flex-col items-center text-center">
      <h1 className="sr-only">The Magic</h1>

      <div className="flex w-full max-w-[28rem] flex-col items-center px-1">
        <motion.p
          className="font-editorial text-[1.35rem] leading-[1.4] text-pretty text-brand-ink italic sm:text-[1.6rem] lg:text-[1.75rem]"
          initial={instant ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={introTransition(
            { duration: 0.7, delay: magicTimings.heading },
            instant,
            { ease: introEase },
          )}
        >
          {copy.heading}
        </motion.p>
        <motion.p
          className="mt-3 max-w-[24rem] text-[0.86rem] leading-[1.65] text-pretty text-white/46 sm:text-[0.92rem]"
          initial={instant ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={introTransition(
            { duration: 0.7, delay: magicTimings.supporting },
            instant,
          )}
        >
          {copy.supporting}
        </motion.p>
      </div>

      <MagicDemo instant={instant} />

      <UnderstoodLabel instant={instant} />

      <IntroNextButton
        onNext={onNext}
        immediate
        appearDelay={instant ? 0 : magicTimings.next}
        disabled={disabled}
        compact
      />
    </section>
  );
}
