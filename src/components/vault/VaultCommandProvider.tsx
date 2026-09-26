"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type VaultCommandContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
};

const VaultCommandContext = createContext<VaultCommandContextValue | null>(
  null,
);

export function VaultCommandProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((value) => !value), []);

  const value = useMemo(
    () => ({
      open,
      setOpen,
      toggle,
    }),
    [open, toggle],
  );

  return (
    <VaultCommandContext.Provider value={value}>
      {children}
    </VaultCommandContext.Provider>
  );
}

export function useVaultCommand() {
  const context = useContext(VaultCommandContext);
  if (!context) {
    throw new Error("useVaultCommand must be used within VaultCommandProvider");
  }
  return context;
}
