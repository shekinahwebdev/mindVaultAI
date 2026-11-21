"use client";

import { motion, useReducedMotion } from "framer-motion";

import { PageStack } from "@/components/mv/PageStack";
import type { SessionData } from "@/lib/auth/session";
import type { DashboardData } from "@/lib/vault/dashboard-queries";
import { cn } from "@/lib/utils";

import { vaultEase } from "../vault-motion";

import { VaultEntrance } from "@/components/mv/VaultEntrance";

import { DashboardActivityStream } from "./DashboardActivityStream";
import { DashboardCaptureShortcuts } from "./DashboardCaptureShortcuts";
import { DashboardCategoriesStrip } from "./DashboardCategoriesStrip";
import { DashboardCollectionsStrip } from "./DashboardCollectionsStrip";
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
    : "Pick up where you left off.";

  return (
    <motion.div
      variants={container}
      initial={reduceMotion ? false : "hidden"}
      animate="show"
    >
      <PageStack className="gap-3 lg:max-w-6xl lg:gap-4">
        <motion.div variants={item}>
          <DashboardHero session={session} lead={lead} />
        </motion.div>

        <motion.div variants={item}>
          <VaultEntrance delay={0.02}>
            <DashboardCaptureShortcuts />
          </VaultEntrance>
        </motion.div>

        <motion.div variants={item} className="md:hidden">
          <DashboardStats stats={data.stats} />
        </motion.div>

        <motion.div
          variants={item}
          className={cn(
            "grid min-w-0 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(12rem,1fr)] lg:items-start lg:gap-5",
          )}
        >
          <DashboardActivityStream
            recentNotes={data.recentNotes}
            recentlyEdited={data.recentlyEdited}
            isEmpty={data.isEmpty}
            className="min-w-0"
          />
          <div className="flex min-w-0 flex-col gap-4">
            <DashboardCategoriesStrip
              categories={data.categories}
              isEmpty={data.isEmpty}
            />
            <DashboardCollectionsStrip collections={data.collections} />
          </div>
        </motion.div>
      </PageStack>
    </motion.div>
  );
}