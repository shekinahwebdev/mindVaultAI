"use client";

import Link from "next/link";
import { ChevronDown, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { NoteType } from "@/generated/prisma/enums";
import { captureNoteTypeOptions } from "@/lib/notes/capture-config";
import { vaultRoutes } from "@/lib/routes";
import { getNoteTypeIcon } from "@/lib/vault/note-type-ui";
import { cn } from "@/lib/utils";

import { vaultPrimaryButton } from "./vault-controls";

const quickCaptureTypeSet = new Set<string>([
  NoteType.NOTE,
  NoteType.LINK,
  NoteType.CODE,
  NoteType.QUOTE,
  NoteType.OTHER,
]);

const quickCaptureTypes = captureNoteTypeOptions.filter((option) =>
  quickCaptureTypeSet.has(option.value),
);

export function AddToVaultMenu({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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

  return (
    <div ref={rootRef} className={cn("relative", open && "z-50")}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          vaultPrimaryButton,
          compact ? "h-9 gap-1.5 px-3 text-[0.8rem]" : "h-9 gap-2 px-3.5 text-[0.82rem]",
        )}
      >
        <Plus aria-hidden className="size-4" />
        {compact ? "Add" : "Add to Vault"}
        <ChevronDown
          aria-hidden
          className={cn("size-3.5 opacity-70 transition-transform", open && "rotate-180")}
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute top-[calc(100%+6px)] right-0 z-[60] min-w-[12.5rem] rounded-[12px] border border-border bg-surface p-1.5 shadow-[0_16px_40px_rgb(0_0_0/0.14)]"
        >
          {quickCaptureTypes.map((option) => {
            const Icon = getNoteTypeIcon(option.value);
            return (
              <Link
                key={option.value}
                role="menuitem"
                href={`${vaultRoutes.capture}?type=${option.value}`}
                className="flex items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-[0.84rem] text-foreground transition-colors hover:bg-mv-panel"
                onClick={() => setOpen(false)}
              >
                <Icon aria-hidden className="size-4 text-muted-foreground" />
                {option.label === "Note" ? "New note" : `Save ${option.label.toLowerCase()}`}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
