"use client";

import { motion } from "framer-motion";
import Image from "next/image";

import { brand } from "@/lib/brand";

import { useIntroInstant } from "./IntroPlayback";
import { introTimings, introTransition } from "./intro-motion";

export function IntroLogo() {
  const instant = useIntroInstant();

  return (
    <motion.div
      className="relative flex items-center justify-center bg-transparent"
      initial={instant ? false : { opacity: 0, scale: 0.86 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={introTransition(introTimings.logo, instant)}
    >
      <Image
        src={brand.logo.src}
        alt={brand.logo.alt}
        width={brand.logo.width}
        height={brand.logo.height}
        preload
        placeholder="empty"
        unoptimized
        sizes="(max-width: 640px) 56px, (max-width: 1024px) 64px, 72px"
        className="relative h-auto w-[3.5rem] bg-transparent select-none sm:w-[4rem] lg:w-[4.5rem]"
        style={{ backgroundColor: "transparent" }}
      />
    </motion.div>
  );
}
