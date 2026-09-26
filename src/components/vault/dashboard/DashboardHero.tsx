"use client";

import {
  vaultPageLeadClassName,
  vaultPageTitleClassName,
} from "@/lib/vault/vault-typography";
import { cn } from "@/lib/utils";

import { MindVaultCompanion } from "../MindVaultCompanion";

type DashboardHeroProps = {
  greeting: string;
  name: string;
  lead: string;
};

export function DashboardHero({ greeting, name, lead }: DashboardHeroProps) {
  return (
    <header>
      <h1 className={vaultPageTitleClassName}>
        {greeting}, {name}{" "}
        <MindVaultCompanion />
      </h1>
      <p className={cn(vaultPageLeadClassName, "mt-1.5")}>{lead}</p>
    </header>
  );
}
