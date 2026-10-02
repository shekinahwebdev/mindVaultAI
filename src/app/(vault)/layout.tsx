import type { ReactNode } from "react";

import { VaultShell } from "@/components/vault/VaultShell";
import { requireSession } from "@/lib/auth/guards";
import { enrichSessionWithAvatar } from "@/lib/profile/user-profile.server";
import { getOrCreateUserPreferences } from "@/lib/settings/settings-queries";
import { prismaThemeToPreference, resolveTheme } from "@/lib/theme";

export const dynamic = "force-dynamic";

export default async function VaultLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await enrichSessionWithAvatar(await requireSession());
  const preferences = await getOrCreateUserPreferences(session.userId);
  const preference = prismaThemeToPreference(preferences.theme);
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
