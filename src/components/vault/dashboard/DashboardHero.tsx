"use client";

import { PageHeader } from "@/components/mv/PageHeader";

import type { SessionData } from "@/lib/auth/session";
import { dashboardInspirationalQuote } from "@/lib/vault/dashboard-data";
import { getVaultGreetingName, getVaultTimeGreeting } from "@/lib/vault/user-display";
import { cn } from "@/lib/utils";

import { MindVaultCompanion } from "../MindVaultCompanion";

type DashboardHeroProps = {
  session: SessionData;
  lead: string;
};

export function DashboardHero({ session, lead }: DashboardHeroProps) {
  const greeting = getVaultTimeGreeting();
  const name = getVaultGreetingName(session);

  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        "lg:flex-row lg:items-start lg:justify-between lg:gap-8",
      )}
    >
      <PageHeader
        className="min-w-0 flex-1"
        title={
          <>
            {greeting}, {name}{" "}
            <MindVaultCompanion />
          </>
        }
        lead={lead}
      />
      <p
        className={cn(
          "font-editorial max-w-[15rem] text-pretty text-[0.9375rem] leading-snug text-muted-foreground italic",
          "lg:pt-1 lg:text-right",
        )}
      >
        &ldquo;{dashboardInspirationalQuote}&rdquo;
      </p>
    </div>
  );
}
