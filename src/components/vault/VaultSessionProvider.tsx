"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { SessionData } from "@/lib/auth/session";

const VaultSessionContext = createContext<SessionData | null>(null);

type VaultSessionProviderProps = {
  session: SessionData;
  children: ReactNode;
};

export function VaultSessionProvider({
  session,
  children,
}: VaultSessionProviderProps) {
  return (
    <VaultSessionContext.Provider value={session}>
      {children}
    </VaultSessionContext.Provider>
  );
}

export function useVaultSession() {
  const session = useContext(VaultSessionContext);
  if (!session) {
    throw new Error("useVaultSession must be used within VaultSessionProvider");
  }
  return session;
}
