"use client";

import Image from "next/image";
import { motion } from "framer-motion";

import { landingHeroMascot } from "@/lib/marketing/landing-hero-content";
import { cn } from "@/lib/utils";

/** Visible character ~150–180px tall on desktop (container includes transparent pad in asset). */
export const dashboardGreetingRobotClassName =
  "h-[8.75rem] w-[7.25rem] sm:h-[9.375rem] sm:w-[7.75rem] md:h-[11.25rem] md:w-[9.25rem]";

type MindVaultHeroCompanionProps = {
  active?: boolean;
  className?: string;
};

/** Dashboard greeting robot — sizing only; idle motion lives on the parent wrapper. */
export function MindVaultHeroCompanion({
  active = false,
  className,
}: MindVaultHeroCompanionProps) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-end justify-center",
        dashboardGreetingRobotClassName,
        className,
      )}
      aria-hidden
    >
      <motion.span
        className="relative block h-[94%] w-[92%]"
        animate={{
          rotate: active ? [0, -4, 5, -2, 0] : 0,
          scale: active ? 1.03 : 1,
        }}
        transition={
          active
            ? { duration: 0.65, ease: "easeInOut" }
            : { type: "spring", stiffness: 400, damping: 28 }
        }
      >
        <Image
          src={landingHeroMascot.src}
          alt=""
          width={landingHeroMascot.width}
          height={landingHeroMascot.height}
          unoptimized
          draggable={false}
          className={cn(
            "h-full w-full object-contain object-bottom",
            "drop-shadow-[0_10px_28px_rgba(0,0,0,0.4)]",
            active && "drop-shadow-[0_12px_32px_rgba(255,255,255,0.08)]",
          )}
          sizes="(max-width: 640px) 8.75rem, (max-width: 768px) 9.375rem, 11.25rem"
        />
      </motion.span>
    </span>
  );
}
