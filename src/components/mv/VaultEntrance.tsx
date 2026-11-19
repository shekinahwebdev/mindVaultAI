"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

import { vaultEase } from "@/components/vault/vault-motion";
import { cn } from "@/lib/utils";

type VaultEntranceProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

/** Subtle mount fade — framer-motion (no extra deps). Respects reduced motion. */
export function VaultEntrance({
  children,
  className,
  delay = 0,
}: VaultEntranceProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={cn(className)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: vaultEase, delay }}
    >
      {children}
    </motion.div>
  );
}