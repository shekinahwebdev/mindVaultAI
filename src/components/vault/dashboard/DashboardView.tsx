"use client";

import { motion, useReducedMotion } from "framer-motion";

import { PageStack } from "@/components/mv/PageStack";
import type { SessionData } from "@/lib/auth/session";
import type { DashboardData } from "@/lib/vault/dashboard-queries";
import { cn } from "@/lib/utils";

import { vaultEase } from "../vault-motion";

import { DashboardActivityStream } from "./DashboardActivityStream";
import { DashboardCategoriesStrip } from "./DashboardCategoriesStrip";
import { DashboardHero } from "./DashboardHero";
import { DashboardStats } from "./DashboardStats";

type DashboardViewProps = {
  session: SessionData;
  data: DashboardData;
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.02 },
  },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: vaultEase },
  },
};

export function DashboardView({ session, data }: DashboardViewProps) {
  const reduceMotion = useReducedMotion();

  const lead = data.isEmpty
    ? "Your vault is ready. Capture your first idea, link, or snippet to get started."
    : "Your vault is ready. Pick up where you left off.";

  return (
    <motion.div
      variants={container}
      initial={reduceMotion ? false : "hidden"}
      animate="show"
    >
      <PageStack className="gap-5 lg:gap-6">
        <motion.div variants={item}>
          <DashboardHero session={session} lead={lead} />
        </motion.div>

        <motion.div variants={item}>
          <DashboardStats stats={data.stats} />
        </motion.div>

        <motion.div
          variants={item}
          className={cn(
            "grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(16rem,22rem)] lg:items-stretch lg:gap-5",
          )}
        >
          <DashboardActivityStream
            recentNotes={data.recentNotes}
            recentlyEdited={data.recentlyEdited}
            isEmpty={data.isEmpty}
            className="min-w-0"
          />
          <DashboardCategoriesStrip
            categories={data.categories}
            isEmpty={data.isEmpty}
            className="min-w-0"
          />
        </motion.div>
      </PageStack>
    </motion.div>
  );
}
