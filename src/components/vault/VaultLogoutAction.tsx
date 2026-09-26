"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";

import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

import { vaultActionFocus } from "./vault-controls";

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
        "text-mv-faint transition-colors hover:bg-mv-panel hover:text-foreground/85 disabled:cursor-not-allowed disabled:opacity-50",
        iconOnly
          ? `inline-flex size-10 items-center justify-center rounded-full ${vaultActionFocus}`
          : cn("flex min-w-0 items-center gap-3", vaultActionFocus),
        className,
      )}
    >
      {icon}
      <span className={cn(iconOnly && "sr-only")}>{statusLabel}</span>
    </button>
  );
}
