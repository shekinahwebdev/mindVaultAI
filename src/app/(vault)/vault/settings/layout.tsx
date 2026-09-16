import type { ReactNode } from "react";

import { SettingsShell } from "@/components/vault/settings/SettingsShell";

export default function VaultSettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <SettingsShell>{children}</SettingsShell>;
}
