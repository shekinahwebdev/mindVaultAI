"use client";

import { motion, useReducedMotion } from "framer-motion";

import { introTimings, introTransition } from "./intro-motion";

const STARS = [
  [7, 9, 0.7, 0.28],
  [14, 22, 0.45, 0.18],
  [21, 6, 0.55, 0.32],
  [28, 31, 0.4, 0.16],
  [36, 14, 0.8, 0.38],
  [43, 41, 0.5, 0.2],
  [51, 8, 0.45, 0.22],
  [58, 27, 0.65, 0.3],
  [66, 18, 0.4, 0.15],
  [73, 36, 0.7, 0.26],
  [81, 11, 0.5, 0.2],
  [88, 29, 0.45, 0.18],
  [5, 48, 0.55, 0.22],
  [12, 63, 0.4, 0.14],
  [19, 71, 0.75, 0.34],
  [27, 55, 0.45, 0.17],
  [34, 78, 0.5, 0.2],
  [42, 59, 0.6, 0.24],
  [49, 84, 0.4, 0.16],
  [57, 67, 0.7, 0.3],
  [64, 52, 0.45, 0.18],
  [72, 88, 0.55, 0.22],
  [79, 61, 0.4, 0.14],
  [86, 74, 0.65, 0.26],
  [93, 46, 0.5, 0.2],
  [9, 91, 0.45, 0.16],
  [24, 94, 0.6, 0.24],
  [38, 97, 0.4, 0.14],
  [61, 93, 0.55, 0.2],
  [77, 96, 0.45, 0.16],
  [16, 39, 1.05, 0.42],
  [69, 7, 0.95, 0.36],
  [91, 58, 0.85, 0.32],
  [4, 76, 0.5, 0.18],
  [47, 3, 0.55, 0.22],
] as const;

export function IntroAtmosphere() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={introTransition(introTimings.page, reduceMotion)}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,rgba(255,255,255,0.05)_0%,transparent_54%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_48%,rgba(0,0,0,0.5)_100%)]" />

      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <circle
          cx="-8"
          cy="52"
          r="46"
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="0.12"
        />
        <circle
          cx="-6"
          cy="50"
          r="38"
          fill="none"
          stroke="rgba(255,255,255,0.045)"
          strokeWidth="0.1"
        />
        <circle
          cx="108"
          cy="46"
          r="44"
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="0.12"
        />
        <circle
          cx="106"
          cy="50"
          r="36"
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth="0.1"
        />

        {STARS.map(([cx, cy, r, opacity], index) => (
          <circle
            key={`${cx}-${cy}-${index}`}
            cx={cx}
            cy={cy}
            r={r * 0.18}
            fill={`rgba(255,255,255,${opacity})`}
          />
        ))}
      </svg>
    </motion.div>
  );
}
