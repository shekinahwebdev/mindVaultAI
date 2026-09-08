"use client";

import { useEffect, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type VaultDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
};

export function VaultDialog({
  open,
  title,
  description,
  onClose,
  children,
  className,
}: VaultDialogProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="vault-dialog-title"
        className={cn(
          "relative z-10 w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#0d0d10] p-5 shadow-[0_24px_64px_rgba(0,0,0,0.45)] sm:p-6",
          className,
        )}
      >
        <h2
          id="vault-dialog-title"
          className="font-editorial text-[1.25rem] text-brand-ink italic"
        >
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-[0.84rem] leading-relaxed text-white/46">
            {description}
          </p>
        ) : null}
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}
