import type { ReactNode } from "react";

import { VaultShell } from "@/components/vault/VaultShell";
import { requireSession } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function VaultLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireSession();
  return <VaultShell session={session}>{children}</VaultShell>;
}
