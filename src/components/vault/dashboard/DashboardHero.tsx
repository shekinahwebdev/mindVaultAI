"use client";

import { PageHeader } from "@/components/mv/PageHeader";

import type { SessionData } from "@/lib/auth/session";
import { dashboardInspirationalQuote } from "@/lib/vault/dashboard-data";
import { getVaultGreetingName, getVaultTimeGreeting } from "@/lib/vault/user-display";
import { cn } from "@/lib/utils";

import { DashboardGreetingMascot } from "./DashboardGreetingMascot";

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
        "flex min-w-0 flex-col gap-5",
        "sm:flex-row sm:items-center sm:gap-8 lg:gap-12",
      )}
    >
      <div className="min-w-0 flex-1">
        <PageHeader
          className="!flex-col !gap-0"
          size="compact"
          title={
            <span className="min-w-0">
              {greeting}, {name}
            </span>
          }
          lead={lead}
        />
        <p
          className={cn(
            "mt-3 max-w-md text-pretty font-editorial text-[0.8125rem] leading-snug text-muted-foreground italic",
            "sm:text-[0.875rem]",
          )}
        >
          &ldquo;{dashboardInspirationalQuote}&rdquo;
        </p>
      </div>

      <DashboardGreetingMascot />
    </div>
  );
}
