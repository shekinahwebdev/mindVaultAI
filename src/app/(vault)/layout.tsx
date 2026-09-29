import { cookies } from "next/headers";
import type { ReactNode } from "react";

import { VaultShell } from "@/components/vault/VaultShell";
import { requireSession } from "@/lib/auth/guards";
import { getOrCreateUserPreferences } from "@/lib/settings/settings-queries";
import {
  parseThemePreference,
  prismaThemeToPreference,
  resolveTheme,
  THEME_COOKIE,
} from "@/lib/theme";

export const dynamic = "force-dynamic";

export default async function VaultLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireSession();
  const [cookieStore, preferences] = await Promise.all([
    cookies(),
    getOrCreateUserPreferences(session.userId),
  ]);
  const cookiePref = parseThemePreference(cookieStore.get(THEME_COOKIE)?.value);
  const storedPref = prismaThemeToPreference(preferences.theme);
  const preference =
    cookiePref ?? (storedPref === "system" ? "light" : storedPref);
  const resolved = resolveTheme(preference, true);

  return (
    <>
      <VaultShell
        session={session}
        themePreference={preference}
        resolvedTheme={resolved}
      >
        {children}
      </VaultShell>
    </>
  );
}
