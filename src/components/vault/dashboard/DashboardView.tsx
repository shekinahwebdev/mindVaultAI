"use client";

import { motion, useReducedMotion } from "framer-motion";

import type { SessionData } from "@/lib/auth/session";
import type { DashboardData } from "@/lib/vault/dashboard-queries";
import { getVaultGreetingName, getVaultTimeGreeting } from "@/lib/vault/user-display";

import { useVaultCommand } from "../VaultCommandProvider";
import { vaultEase } from "../vault-motion";

import { DashboardActivityStream } from "./DashboardActivityStream";
import { DashboardAiInsight } from "./DashboardAiInsight";
import { DashboardAskBar } from "./DashboardAskBar";
import { DashboardBentoStats } from "./DashboardBentoStats";
import { DashboardCategoriesStrip } from "./DashboardCategoriesStrip";
import { DashboardHero } from "./DashboardHero";

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
  const greetingName = getVaultGreetingName(session);
  const greeting = getVaultTimeGreeting();
  const reduceMotion = useReducedMotion();
  const { setOpen } = useVaultCommand();

  const lead = data.isEmpty
    ? "Your vault is ready. Capture your first idea, link, or snippet to get started."
    : "Your vault is ready. Pick up where you left off.";

  return (
    <motion.div
      variants={container}
      initial={reduceMotion ? false : "hidden"}
      animate="show"
      className="flex flex-col gap-4 lg:gap-5"
    >
      <motion.div variants={item}>
        <DashboardHero greeting={greeting} name={greetingName} lead={lead} />
      </motion.div>

      <motion.div variants={item}>
        <DashboardAskBar onOpenCommand={() => setOpen(true)} />
      </motion.div>

      {!data.isEmpty ? (
        <>
          <motion.div
            variants={item}
            className="grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(17rem,21rem)] lg:items-stretch"
          >
            <DashboardActivityStream
              recentNotes={data.recentNotes}
              recentlyEdited={data.recentlyEdited}
              isEmpty={data.isEmpty}
              className="h-full min-w-0 lg:min-h-[min(24rem,50vh)]"
            />
            <aside className="flex h-full min-h-0 w-full min-w-0 flex-col">
              <DashboardBentoStats stats={data.stats} className="h-full min-h-0" />
            </aside>
          </motion.div>
          <motion.div
            variants={item}
            className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
          >
            <DashboardCategoriesStrip
              categories={data.categories}
              isEmpty={data.isEmpty}
            />
            <DashboardAiInsight hasNotes />
          </motion.div>
        </>
      ) : (
        <motion.div
          variants={item}
          className="grid gap-3 lg:grid-cols-2"
        >
          <DashboardAiInsight hasNotes={false} />
          <DashboardCategoriesStrip
            categories={data.categories}
            isEmpty={data.isEmpty}
          />
        </motion.div>
      )}

      {data.isEmpty ? (
        <motion.div variants={item}>
          <DashboardActivityStream
            recentNotes={data.recentNotes}
            recentlyEdited={data.recentlyEdited}
            isEmpty
          />
        </motion.div>
      ) : null}
    </motion.div>
  );
}
