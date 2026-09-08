"use client";

import { motion } from "framer-motion";

import type { SessionData } from "@/lib/auth/session";
import type { DashboardData } from "@/lib/vault/dashboard-queries";
import { getVaultGreetingName } from "@/lib/vault/user-display";

import { DashboardAiInsight } from "./DashboardAiInsight";
import { DashboardCategories } from "./DashboardCategories";
import { DashboardRecentNotes } from "./DashboardRecentNotes";
import { DashboardStats } from "./DashboardStats";
import { vaultEase } from "../vault-motion";

type DashboardViewProps = {
  session: SessionData;
  data: DashboardData;
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: vaultEase },
  },
};

export function DashboardView({ session, data }: DashboardViewProps) {
  const greetingName = getVaultGreetingName(session);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <motion.section variants={item} className="space-y-2">
        <h1 className="font-editorial text-[1.75rem] leading-tight text-brand-ink italic sm:text-[2rem]">
          Welcome back, {greetingName}.
        </h1>
        <p className="max-w-xl text-[0.92rem] leading-relaxed text-white/46">
          {data.isEmpty
            ? "Start building your personal knowledge vault."
            : "Here's what's happening in your vault."}
        </p>
      </motion.section>

      {!data.isEmpty ? (
        <motion.div variants={item}>
          <DashboardStats stats={data.stats} />
        </motion.div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <motion.div variants={item}>
          <DashboardRecentNotes
            recentNotes={data.recentNotes}
            recentlyEdited={data.recentlyEdited}
            isEmpty={data.isEmpty}
          />
        </motion.div>
        <div className="space-y-6">
          <motion.div variants={item}>
            <DashboardCategories
              categories={data.categories}
              isEmpty={data.isEmpty}
            />
          </motion.div>
          <motion.div variants={item}>
            <DashboardAiInsight hasNotes={!data.isEmpty} />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
