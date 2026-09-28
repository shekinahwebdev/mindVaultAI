"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

import { marketingTransition } from "@/lib/marketing/marketing-motion";

export default function PricingTemplate({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="min-h-svh bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={marketingTransition(reduceMotion, { duration: 0.4 })}
    >
      {children}
    </motion.div>
  );
}
