"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";

import { routes } from "@/lib/routes";

import { RememberDemo } from "../RememberDemo";
import { introEase, introTransition } from "../intro-motion";
import { rememberTimings } from "../remember-demo";

const copy = {
  heading: "Remember anything.",
  supporting:
    "Find what mattered, even when you don’t remember where you saved it.",
  home: "Your knowledge has a home.",
} as const;

function useSafeReducedMotion() {
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted && reduceMotion === true;
}

export function RememberScreen() {
  const instant = useSafeReducedMotion();

  return (
    <section className="relative flex w-full max-w-xl flex-col items-center text-center">
      <h1 className="sr-only">Remember</h1>

      <div className="flex w-full max-w-[28rem] flex-col items-center px-1">
        <motion.p
          className="font-editorial text-[1.35rem] leading-[1.4] text-pretty text-brand-ink italic sm:text-[1.6rem] lg:text-[1.75rem]"
          initial={instant ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={introTransition(
            { duration: 0.7, delay: rememberTimings.heading },
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
            { duration: 0.7, delay: rememberTimings.supporting },
            instant,
          )}
        >
          {copy.supporting}
        </motion.p>
      </div>

      <RememberDemo instant={instant} />

      <p
        className={`remember-home font-editorial mt-5 text-[1.02rem] text-brand-ink italic sm:mt-6 sm:text-[1.08rem] ${
          instant ? "remember-demo-instant" : ""
        }`}
      >
        {copy.home}
      </p>

      <div
        className={`remember-actions mt-5 flex w-full max-w-[20rem] flex-col items-center gap-2.5 sm:mt-6 ${
          instant ? "remember-demo-instant" : ""
        }`}
      >
        <Link
          href={routes.signUp}
          className="group relative inline-flex min-h-11 w-full items-center justify-center overflow-hidden rounded-full bg-brand-ink px-7 py-2.5 text-[0.8rem] tracking-[0.18em] text-brand-void uppercase sm:px-8"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent_35%,rgba(5,5,7,0.08)_48%,transparent_62%)] bg-[length:220%_100%] bg-[position:120%_0] transition-[background-position] duration-700 ease-out group-hover:bg-[position:-20%_0]"
          />
          <span className="relative">Create My Vault</span>
        </Link>
        <Link
          href={routes.signIn}
          className="inline-flex min-h-10 items-center justify-center px-3 text-[0.78rem] tracking-[0.18em] text-white/48 uppercase transition-colors hover:text-white"
        >
          Sign in
        </Link>
      </div>
    </section>
  );
}
