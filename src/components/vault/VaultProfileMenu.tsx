"use client";

import Link from "next/link";
import { ChevronDown, CreditCard, LogOut, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { vaultRoutes } from "@/lib/routes";
import { UserAvatar } from "@/components/vault/UserAvatar";
import { cn } from "@/lib/utils";

import { vaultActionFocus } from "./vault-controls";
import { useVaultSession } from "./VaultSessionProvider";

type VaultProfileMenuProps = {
  compact?: boolean;
};

export function VaultProfileMenu({ compact = false }: VaultProfileMenuProps) {
  const session = useVaultSession();
  const router = useRouter();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const displayName = session.name?.trim() || session.email.split("@")[0];

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  async function signOut() {
    if (signingOut) {
      return;
    }
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Still redirect if the request fails.
    } finally {
      setOpen(false);
      router.push("/sign-in");
      router.refresh();
      setSigningOut(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        id={`${menuId}-trigger`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={`${menuId}-menu`}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex items-center gap-1.5 rounded-[var(--mv-radius-control,0.5rem)] bg-surface py-0.5 pr-2 pl-0.5 shadow-[var(--mv-shadow-card)] transition-colors hover:bg-mv-panel",
          vaultActionFocus,
          compact && "bg-transparent pr-0 shadow-none hover:bg-mv-panel",
        )}
      >
        <UserAvatar session={session} size="sm" className="shrink-0" />
        {compact ? null : (
          <>
            <span className="hidden max-w-[7.5rem] truncate text-[0.78rem] font-medium text-foreground lg:inline">
              {displayName}
            </span>
            <ChevronDown
              aria-hidden
              className={cn(
                "hidden size-3.5 text-mv-faint transition-transform lg:block",
                open && "rotate-180",
              )}
            />
          </>
        )}
        {compact ? <span className="sr-only">{displayName}</span> : null}
      </button>

      {open ? (
        <div
          id={`${menuId}-menu`}
          role="menu"
          aria-labelledby={`${menuId}-trigger`}
          className="absolute top-[calc(100%+6px)] right-0 z-50 min-w-[12rem] rounded-[var(--mv-radius-card)] border border-border bg-surface p-1.5 shadow-[var(--mv-shadow-elevated)]"
        >
          <p className="px-2.5 py-1.5 text-[0.75rem] text-mv-faint">{displayName}</p>
          <Link
            role="menuitem"
            href={vaultRoutes.settings}
            className="flex items-center gap-2.5 rounded-[var(--mv-radius-control)] px-2.5 py-2 text-[0.8125rem] text-foreground transition-colors hover:bg-mv-panel"
            onClick={() => setOpen(false)}
          >
            <Settings aria-hidden className="size-4 text-muted-foreground" />
            Account & settings
          </Link>
          <Link
            role="menuitem"
            href={vaultRoutes.subscription}
            className="flex items-center gap-2.5 rounded-[var(--mv-radius-control)] px-2.5 py-2 text-[0.8125rem] text-foreground transition-colors hover:bg-mv-panel"
            onClick={() => setOpen(false)}
          >
            <CreditCard aria-hidden className="size-4 text-muted-foreground" />
            Plan & subscription
          </Link>
          <div className="my-1 border-t border-border/80" role="none" />
          <button
            type="button"
            role="menuitem"
            disabled={signingOut}
            aria-busy={signingOut}
            onClick={() => void signOut()}
            className="flex w-full items-center gap-2.5 rounded-[var(--mv-radius-control)] px-2.5 py-2 text-left text-[0.8125rem] text-foreground transition-colors hover:bg-mv-panel disabled:opacity-50"
          >
            <LogOut aria-hidden className="size-4 text-muted-foreground" />
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
