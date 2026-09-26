"use client";

import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { VaultToaster } from "@/components/theme/VaultToaster";
import type { SessionData } from "@/lib/auth/session";
import { vaultRoutes } from "@/lib/routes";
import type { ResolvedTheme, ThemePreference } from "@/lib/theme";
import { cn } from "@/lib/utils";

import { PreferencesProvider } from "@/lib/settings/preferences-context";

import { VaultCommandPalette } from "./VaultCommandPalette";
import { VaultCommandProvider, useVaultCommand } from "./VaultCommandProvider";
import { VaultMobileHeader } from "./VaultMobileHeader";
import { VaultMobileNav } from "./VaultMobileNav";
import { VaultSessionProvider } from "./VaultSessionProvider";
import { VaultSidebar } from "./VaultSidebar";
import { VaultSidebarProvider } from "./VaultSidebarProvider";
import { VaultTopBar } from "./VaultTopBar";

type VaultShellProps = {
  session: SessionData;
  themePreference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  children: ReactNode;
};

function VaultKeyboardShortcuts() {
  const { toggle } = useVaultCommand();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isModK =
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "k" &&
        !event.shiftKey &&
        !event.altKey;

      if (!isModK) {
        return;
      }

      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT")
      ) {
        return;
      }

      event.preventDefault();
      toggle();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggle]);

  return null;
}

export function VaultShell({
  session,
  themePreference,
  resolvedTheme,
  children,
}: VaultShellProps) {
  const pathname = usePathname();
  const isCapture = pathname === vaultRoutes.capture;

  return (
    <VaultSessionProvider session={session}>
      <ThemeProvider initialPreference={themePreference}>
        <PreferencesProvider>
          <VaultCommandProvider>
            <VaultSidebarProvider>
            <VaultKeyboardShortcuts />
            <div
              id="mv-app"
              className={cn(
                "mv-app text-foreground md:p-3",
                resolvedTheme,
                isCapture ? "h-svh overflow-hidden" : "min-h-svh",
              )}
            >
              <div
                className={cn(
                  "mv-frame flex overflow-hidden md:rounded-[22px]",
                  isCapture
                    ? "h-full"
                    : "min-h-svh md:min-h-[calc(100svh-1.5rem)]",
                )}
              >
                <VaultSidebar />

                <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                  {!isCapture ? <VaultMobileHeader /> : null}
                  {!isCapture ? <VaultTopBar /> : null}

                  <main
                    className={cn(
                      "flex min-h-0 flex-1 flex-col",
                      isCapture
                        ? "overflow-hidden"
                        : "overflow-y-auto pb-24 md:pb-0",
                    )}
                  >
                    <div
                      className={cn(
                        isCapture
                          ? "flex h-full min-h-0 flex-1 flex-col px-4 py-3 sm:px-6 sm:py-4"
                          : "mx-auto w-full max-w-[88rem] px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6",
                      )}
                    >
                      {children}
                    </div>
                  </main>
                </div>
              </div>

              {!isCapture ? <VaultMobileNav /> : null}
              {!isCapture ? <VaultCommandPalette /> : null}
              <VaultToaster />
            </div>
            </VaultSidebarProvider>
          </VaultCommandProvider>
        </PreferencesProvider>
      </ThemeProvider>
    </VaultSessionProvider>
  );
}
