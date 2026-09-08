"use client";

import { motion } from "framer-motion";
import type { CSSProperties } from "react";

import type { ProblemCardData } from "./problem-cards";

type ProblemCardProps = {
  card: ProblemCardData;
  delay: number;
  instant: boolean;
  layout: "float" | "stack";
  stackAlign?: "start" | "end" | "center";
};

export function ProblemCard({
  card,
  delay,
  instant,
  layout,
  stackAlign = "start",
}: ProblemCardProps) {
  const Icon = card.icon;
  const depth = card.depth;
  const blur = layout === "float" ? (1 - depth) * 0.45 : 0;
  const scale = layout === "stack" ? 1 : 0.9 + depth * 0.1;

  return (
    <motion.article
      className={
        layout === "float"
          ? `absolute max-w-[15.5rem] ${card.desktop.className}`
          : `w-full ${
              stackAlign === "end"
                ? "self-end"
                : stackAlign === "center"
                  ? "self-center max-w-[16.5rem]"
                  : "self-start"
            }`
      }
      style={{
        zIndex: Math.round(depth * 10),
      }}
      initial={instant ? false : { opacity: 0, y: 12, scale: scale * 0.96 }}
      animate={{ opacity: 0.55 + depth * 0.45, y: 0, scale }}
      transition={
        instant
          ? { duration: 0 }
          : {
              duration: 0.7,
              delay,
              ease: [0.16, 1, 0.3, 1],
            }
      }
    >
      <div
        className={instant ? undefined : "problem-card-float"}
        style={
          {
            "--drift-x": layout === "stack" ? "0px" : `${card.drift.x}px`,
            "--drift-y": `${card.drift.y * (layout === "stack" ? 0.35 : 1)}px`,
            "--drift-duration": `${card.drift.duration}s`,
          } as CSSProperties
        }
      >
      <div
        className="rounded-2xl border border-white/12 bg-white/[0.035] px-3.5 py-3 shadow-[0_12px_32px_rgba(0,0,0,0.35)] backdrop-blur-[2px] sm:px-4 sm:py-3.5"
        style={{ filter: blur > 0.05 ? `blur(${blur}px)` : undefined }}
      >
        <div className="flex items-center gap-2 text-[0.65rem] tracking-[0.16em] text-white/42 uppercase">
          <Icon aria-hidden className="size-3.5 text-white/55" />
          {card.source}
        </div>
        <p className="mt-1.5 text-left text-[0.92rem] leading-snug text-white/88">
          {card.title}
        </p>
      </div>
      </div>
    </motion.article>
  );
}
