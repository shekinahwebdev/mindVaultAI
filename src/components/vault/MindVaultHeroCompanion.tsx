"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

import { landingHeroMascot } from "@/lib/marketing/landing-hero-content";
import { usePreferences } from "@/lib/settings/preferences-context";
import { cn } from "@/lib/utils";

export const heroCompanionSizeClassName =
  "h-[4.25rem] w-[4.25rem] sm:h-20 sm:w-20 md:h-[6.25rem] md:w-[6.25rem]";

type MindVaultHeroCompanionProps = {
  active?: boolean;
  className?: string;
};

/** Dashboard greeting mascot — keyed from `public/animations/preview.webp`. */
export function MindVaultHeroCompanion({
  active = false,
  className,
}: MindVaultHeroCompanionProps) {
  const systemReducedMotion = useReducedMotion();
  const { preferences } = usePreferences();
  const reduceMotion = Boolean(preferences.reducedMotion || systemReducedMotion);

  return (
    <motion.span
      className={cn(
        "relative inline-flex shrink-0 items-end justify-center",
        heroCompanionSizeClassName,
        className,
      )}
      aria-hidden
      animate={reduceMotion ? undefined : { y: [0, -5, 0] }}
      transition={{
        duration: 3.6,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <motion.span
        className="relative block h-[92%] w-[88%]"
        animate={{ rotate: active ? 6 : 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 22 }}
      >
        <Image
          src={landingHeroMascot.src}
          alt=""
          width={landingHeroMascot.width}
          height={landingHeroMascot.height}
          unoptimized
          draggable={false}
          className="h-full w-full object-contain object-bottom drop-shadow-[0_8px_20px_rgba(0,0,0,0.35)]"
          sizes="(max-width: 640px) 4.25rem, (max-width: 768px) 5rem, 6.25rem"
        />
      </motion.span>
    </motion.span>
  );
}
