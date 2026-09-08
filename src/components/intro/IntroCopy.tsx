"use client";

import { motion } from "framer-motion";

import { brand } from "@/lib/brand";

import { useIdentityIntroInstant } from "./IntroPlayback";
import { introTimings, introTransition } from "./intro-motion";

export function IntroCopy() {
  const instant = useIdentityIntroInstant();

  return (
    <div className="mt-2 flex w-full max-w-[22rem] flex-col items-center px-1 text-center sm:mt-2.5 sm:max-w-[26rem] lg:mt-3 lg:max-w-[30rem]">
      <motion.p
        className="font-editorial text-[1.125rem] leading-[1.45] font-normal text-pretty text-brand-ink italic sm:text-[1.28rem] md:text-[1.42rem]"
        initial={instant ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={introTransition(introTimings.tagline, instant)}
      >
        {brand.tagline}
      </motion.p>
      <motion.p
        className="font-editorial mt-3 max-w-[19.5rem] text-[0.8125rem] leading-[1.75] font-normal text-pretty text-white/46 sm:mt-3.5 sm:max-w-[23.5rem] sm:text-[0.9rem] md:max-w-[26rem] md:text-[0.95rem]"
        initial={instant ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={introTransition(introTimings.supporting, instant)}
      >
        Capture what matters. Keep what you learn.
        <br />
        Find it again when you need it.
      </motion.p>
    </div>
  );
}
