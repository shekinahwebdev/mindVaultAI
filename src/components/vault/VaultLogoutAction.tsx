"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";

import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

import { vaultActionFocus, vaultActionShape } from "./vault-controls";

type VaultLogoutActionProps = {
  label: string;
  icon?: ReactNode;
  className?: string;
  iconOnly?: boolean;
};

export function VaultLogoutAction({
  label,
  icon,
  className,
  iconOnly = false,
}: VaultLogoutActionProps) {
  const router = useRouter();
  const signingOutRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const statusLabel = loading ? "Signing out…" : label;

  async function logout() {
    if (loading || signingOutRef.current) {
      return;
    }

    signingOutRef.current = true;
    setLoading(true);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Still redirect if the request fails.
    } finally {
      router.push(routes.signIn);
      router.refresh();
      signingOutRef.current = false;
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      aria-busy={loading}
      aria-label={statusLabel}
      className={cn(
        "inline-flex items-center justify-center gap-2 text-mv-faint transition-colors hover:bg-mv-panel hover:text-foreground/85 disabled:cursor-not-allowed disabled:opacity-50",
        iconOnly
          ? `size-10 rounded-full ${vaultActionFocus}`
          : `px-2.5 py-2 text-[0.8125rem] font-medium ${vaultActionShape}`,
        className,
      )}
    >
      {icon}
      <span className={cn(iconOnly && "sr-only")}>{statusLabel}</span>
    </button>
  );
}
