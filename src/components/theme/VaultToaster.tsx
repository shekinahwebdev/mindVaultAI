"use client";

import { Toaster } from "sonner";

import { useTheme } from "./ThemeProvider";

export function VaultToaster() {
  const { resolved } = useTheme();

  return (
    <Toaster
      theme={resolved}
      position="bottom-right"
      closeButton
      duration={3600}
      offset={16}
      mobileOffset={12}
      toastOptions={{
        classNames: {
          toast:
            "rounded-[8px] border border-border bg-surface text-foreground shadow-[0_8px_24px_rgba(0,0,0,0.18)] text-[0.84rem]",
          title: "text-[0.84rem] font-medium text-foreground",
          description: "text-[0.78rem] text-muted-foreground",
          closeButton:
            "border-border bg-mv-panel text-muted-foreground hover:bg-secondary",
          success: "border-border",
          error: "border-red-400/25",
          warning: "border-border",
          info: "border-border",
        },
      }}
    />
  );
}
