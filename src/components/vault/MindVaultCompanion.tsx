"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useId } from "react";

import { cn } from "@/lib/utils";

import { vaultEase } from "./vault-motion";

type MindVaultCompanionProps = {
  className?: string;
};

const sizeClassName = "size-8 sm:size-9";

/** Static SVG companion — fallback when Lottie is unavailable or reduced motion is on. */
export function MindVaultCompanionFallback({ className }: MindVaultCompanionProps) {
  const clipId = `mv-companion-${useId().replace(/:/g, "")}`;

  return (
    <span
      className={cn(
        "relative -top-px inline-flex shrink-0 align-middle",
        className ?? sizeClassName,
      )}
      aria-hidden
    >
      <CompanionArt waveDeg={0} eyeScaleY={1} headTiltDeg={0} clipId={clipId} />
    </span>
  );
}

/** Minimal monochrome AI companion — one-shot hello on mount; static when reduced motion. */
export function MindVaultCompanion({ className }: MindVaultCompanionProps) {
  const reduceMotion = useReducedMotion();
  const clipId = `mv-companion-${useId().replace(/:/g, "")}`;

  if (reduceMotion) {
    return <MindVaultCompanionFallback className={className} />;
  }

  return (
    <motion.span
      className={cn(
        "group/companion relative -top-px inline-flex shrink-0 align-middle",
        sizeClassName,
        className,
      )}
      aria-hidden
      initial={{ opacity: 0, x: -5, y: 3 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.38, ease: vaultEase }}
    >
      <motion.span
        className="block size-full text-foreground"
        whileHover={{ rotate: 3 }}
        transition={{ type: "spring", stiffness: 420, damping: 28 }}
      >
        <CompanionArtAnimated clipId={clipId} />
      </motion.span>
    </motion.span>
  );
}

function CompanionArt({
  waveDeg,
  eyeScaleY,
  headTiltDeg,
  clipId,
}: {
  waveDeg: number;
  eyeScaleY: number;
  headTiltDeg: number;
  clipId: string;
}) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="size-full"
      role="presentation"
    >
      <defs>
        <clipPath id={clipId}>
          <rect x="6" y="5" width="28" height="30" rx="4" />
        </clipPath>
      </defs>
      <g
        clipPath={`url(#${clipId})`}
        style={{
          transform: `rotate(${headTiltDeg}deg)`,
          transformOrigin: "20px 16px",
        }}
      >
        <rect
          x="11"
          y="24"
          width="18"
          height="11"
          rx="2.5"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <rect
          x="9"
          y="10"
          width="22"
          height="15"
          rx="4"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <line
          x1="20"
          y1="10"
          x2="20"
          y2="6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="20" cy="5" r="1.25" fill="currentColor" />
        <g
          style={{
            transform: `rotate(${waveDeg}deg)`,
            transformOrigin: "29px 26px",
          }}
        >
          <path
            d="M29 26v-7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="29" cy="17.5" r="1.35" fill="currentColor" />
        </g>
        <path
          d="M11 26v-4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="11" cy="21" r="1.35" fill="currentColor" />
        <ellipse
          cx="16"
          cy="17"
          rx="1.6"
          ry={1.6 * eyeScaleY}
          fill="currentColor"
          style={{ transformOrigin: "16px 17px" }}
        />
        <ellipse
          cx="24"
          cy="17"
          rx="1.6"
          ry={1.6 * eyeScaleY}
          fill="currentColor"
          style={{ transformOrigin: "24px 17px" }}
        />
      </g>
    </svg>
  );
}

function CompanionArtAnimated({ clipId }: { clipId: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="size-full"
      role="presentation"
    >
      <defs>
        <clipPath id={clipId}>
          <rect x="6" y="5" width="28" height="30" rx="4" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect
          x="11"
          y="24"
          width="18"
          height="11"
          rx="2.5"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <motion.g
          style={{ transformOrigin: "20px 17px" }}
          initial={{ rotate: 0 }}
          animate={{ rotate: 0 }}
        >
          <rect
            x="9"
            y="10"
            width="22"
            height="15"
            rx="4"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <line
            x1="20"
            y1="10"
            x2="20"
            y2="6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="20" cy="5" r="1.25" fill="currentColor" />
          <motion.ellipse
            cx="16"
            cy="17"
            rx="1.6"
            ry="1.6"
            fill="currentColor"
            style={{ transformOrigin: "16px 17px", transformBox: "fill-box" }}
            initial={{ scaleY: 1 }}
            animate={{ scaleY: [1, 1, 0.12, 1, 1] }}
            transition={{
              duration: 1.75,
              times: [0, 0.52, 0.58, 0.64, 1],
              ease: "easeInOut",
            }}
          />
          <motion.ellipse
            cx="24"
            cy="17"
            rx="1.6"
            ry="1.6"
            fill="currentColor"
            style={{ transformOrigin: "24px 17px", transformBox: "fill-box" }}
            initial={{ scaleY: 1 }}
            animate={{ scaleY: [1, 1, 0.12, 1, 1] }}
            transition={{
              duration: 1.75,
              times: [0, 0.52, 0.58, 0.64, 1],
              ease: "easeInOut",
            }}
          />
        </motion.g>
        <path
          d="M11 26v-4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="11" cy="21" r="1.35" fill="currentColor" />
        <motion.g
          style={{ transformOrigin: "29px 26px" }}
          initial={{ rotate: 0 }}
          animate={{ rotate: [0, 0, -16, 20, -10, 6, 0] }}
          transition={{
            duration: 1.75,
            times: [0, 0.12, 0.32, 0.5, 0.68, 0.82, 1],
            ease: vaultEase,
          }}
        >
          <path
            d="M29 26v-7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="29" cy="17.5" r="1.35" fill="currentColor" />
        </motion.g>
      </g>
    </svg>
  );
}
