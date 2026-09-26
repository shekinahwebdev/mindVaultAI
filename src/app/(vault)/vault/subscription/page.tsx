import Link from "next/link";

import {
  settingsCompositionClassName,
  settingsPageContainerClassName,
  settingsPanelSurfaceClassName,
} from "@/components/vault/settings/settings-ui";
import { vaultRoutes } from "@/lib/routes";
import { cn } from "@/lib/utils";

import {
  vaultPageLeadClassName,
  vaultPageTitleClassName,
  vaultPrimaryButton,
  vaultSectionTitleClassName,
} from "@/components/vault/vault-controls";

export default function VaultSubscriptionPage() {
  return (
    <div className={cn(settingsPageContainerClassName, "pt-2 lg:pt-4")}>
      <div className={settingsCompositionClassName}>
      <header className="mb-6 lg:mb-8">
        <h1 className={vaultPageTitleClassName}>Subscription &amp; billing</h1>
        <p className={cn(vaultPageLeadClassName, "max-w-prose")}>
          MindVault plans and billing will live here.
        </p>
      </header>

      <section className={cn(settingsPanelSurfaceClassName, "max-w-[50rem] px-6 py-6")}>
        <h2 className={vaultSectionTitleClassName}>Coming soon</h2>
        <p className="mt-2 max-w-prose text-[0.875rem] leading-relaxed text-muted-foreground">
          Subscription management and payment processing are not implemented yet.
          This page is reserved for the next development phase.
        </p>
        <Link
          href={vaultRoutes.settings}
          className={cn("mt-6 inline-flex", vaultPrimaryButton)}
        >
          Back to Settings
        </Link>
      </section>
      </div>
    </div>
  );
}
