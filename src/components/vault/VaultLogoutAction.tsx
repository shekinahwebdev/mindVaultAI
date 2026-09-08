"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";

import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

type VaultLogoutActionProps = {
  label: string;
  icon?: ReactNode;
  className?: string;
};

export function VaultLogoutAction({
  label,
  icon,
  className,
}: VaultLogoutActionProps) {
  const router = useRouter();
  const signingOutRef = useRef(false);
  const [loading, setLoading] = useState(false);

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
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-2.5 py-2 text-[0.72rem] tracking-[0.12em] text-white/45 uppercase transition-colors hover:bg-white/[0.04] hover:text-white/75 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      {icon}
      <span>{loading ? "Signing out…" : label}</span>
    </button>
  );
}
