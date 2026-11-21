"use client";

import { PageHeader } from "@/components/mv/PageHeader";

import type { SessionData } from "@/lib/auth/session";
import { vaultEditorialPageTitleClassName } from "@/lib/vault/vault-typography";
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
        "flex min-w-0 flex-col gap-3",
        "sm:flex-row sm:items-center sm:justify-between sm:gap-4 lg:gap-5",
      )}
    >
      <PageHeader
        className="min-w-0 flex-1 !flex-col !gap-0 !pb-0"
        size="compact"
        title={
          <span
            className={cn(
              "min-w-0",
              vaultEditorialPageTitleClassName,
              "text-[1.5rem] leading-tight sm:text-[1.625rem]",
            )}
          >
            {greeting}, {name}
          </span>
        }
        lead={lead}
      />

      <DashboardGreetingMascot className="sm:shrink-0" />
    </div>
  );
}