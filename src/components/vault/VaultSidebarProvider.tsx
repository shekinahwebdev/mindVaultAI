"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  readVaultSidebarCollapsed,
  writeVaultSidebarCollapsed,
} from "@/lib/vault/sidebar-preference";

type VaultSidebarContextValue = {
  collapsed: boolean;
  toggleCollapsed: () => void;
  setCollapsed: (collapsed: boolean) => void;
};

const VaultSidebarContext = createContext<VaultSidebarContextValue | null>(null);

export function VaultSidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsedState] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setCollapsedState(readVaultSidebarCollapsed());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }
    writeVaultSidebarCollapsed(collapsed);
  }, [collapsed, ready]);

  const setCollapsed = useCallback((next: boolean) => {
    setCollapsedState(next);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsedState((current) => !current);
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
