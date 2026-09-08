"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { routes } from "@/lib/routes";

export function LogoutButton() {
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
      // Still redirect — the session may already be cleared or unreachable.
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
      className="mt-8 inline-flex min-h-9 items-center justify-center rounded-full border border-white/28 px-6 py-2 text-[0.78rem] tracking-[0.18em] text-white uppercase transition-colors hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
