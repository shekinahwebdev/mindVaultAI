"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import type { SessionData } from "@/lib/auth/session";
import { vaultRoutes } from "@/lib/routes";
import { cn } from "@/lib/utils";

import { PreferencesProvider } from "@/lib/settings/preferences-context";

import { VaultMobileHeader } from "./VaultMobileHeader";
import { VaultMobileNav } from "./VaultMobileNav";
import { VaultSessionProvider } from "./VaultSessionProvider";
import { VaultSidebar } from "./VaultSidebar";
import { VaultTopBar } from "./VaultTopBar";

type VaultShellProps = {
  session: SessionData;
  children: ReactNode;
};

export function VaultShell({ session, children }: VaultShellProps) {
  const pathname = usePathname();
  const isCapture = pathname === vaultRoutes.capture;

  return (
    <VaultSessionProvider session={session}>
      <PreferencesProvider>
      <div
        className={cn(
          "flex bg-brand-void text-brand-ink",
          isCapture ? "h-svh overflow-hidden" : "min-h-svh",
        )}
      >
        <VaultSidebar />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {!isCapture ? <VaultMobileHeader /> : null}
          {!isCapture ? <VaultTopBar /> : null}

          <main
            className={cn(
              "flex min-h-0 flex-1 flex-col",
              isCapture ? "overflow-hidden" : "overflow-y-auto pb-24 md:pb-0",
            )}
          >
            <div
              className={cn(
                isCapture
                  ? "flex h-full min-h-0 flex-1 flex-col px-4 py-3 sm:px-6 sm:py-4"
                  : "mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8",
              )}
            >
              {children}
            </div>
          </main>
        </div>

        {!isCapture ? <VaultMobileNav /> : null}
      </div>
      </PreferencesProvider>
    </VaultSessionProvider>
  );
}
