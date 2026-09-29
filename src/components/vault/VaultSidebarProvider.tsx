"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import {
  readVaultSidebarCollapsed,
  getServerVaultSidebarCollapsed,
  setVaultSidebarCollapsed,
  subscribeVaultSidebarCollapsed,
  toggleVaultSidebarCollapsed,
} from "@/lib/vault/sidebar-preference";

type VaultSidebarContextValue = {
  collapsed: boolean;
  toggleCollapsed: () => void;
  setCollapsed: (collapsed: boolean) => void;
};

const VaultSidebarContext = createContext<VaultSidebarContextValue | null>(null);

export function VaultSidebarProvider({ children }: { children: ReactNode }) {
  const collapsed = useSyncExternalStore(
    subscribeVaultSidebarCollapsed,
    readVaultSidebarCollapsed,
    getServerVaultSidebarCollapsed,
  );

  const setCollapsed = useCallback((next: boolean) => {
    setVaultSidebarCollapsed(next);
  }, []);

  const toggleCollapsed = useCallback(() => {
    toggleVaultSidebarCollapsed();
  }, []);

  const value = useMemo(
    () => ({ collapsed, toggleCollapsed, setCollapsed }),
    [collapsed, toggleCollapsed, setCollapsed],
  );

  return (
    <VaultSidebarContext.Provider value={value}>
      {children}
    </VaultSidebarContext.Provider>
  );
}

export function useVaultSidebar() {
  const context = useContext(VaultSidebarContext);
  if (!context) {
    throw new Error("useVaultSidebar must be used within VaultSidebarProvider");
  }
  return context;
}
