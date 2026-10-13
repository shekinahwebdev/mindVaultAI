"use client";

import { Check, Copy, Pencil, X } from "lucide-react";

import { toastError, toastSuccess } from "@/lib/vault-toast";
import { cn } from "@/lib/utils";

type ChatMessageActionsProps = {
  align: "start" | "end";
  copyText: string;
  showEdit?: boolean;
  onEdit?: () => void;
  className?: string;
};

export async function copyChatText(text: string) {
  const trimmed = text.trim();
  if (!trimmed) {
    return;
  }

  try {
    await navigator.clipboard.writeText(trimmed);
    toastSuccess("Copied to clipboard.");
  } catch {
    toastError("Could not copy to clipboard.");
  }
}

export function ChatMessageActions({
  align,
  copyText,
  showEdit,
  onEdit,
  className,
}: ChatMessageActionsProps) {
  const canCopy = copyText.trim().length > 0;

  return (
    <div
      className={cn(
        "flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100",
        align === "end" ? "justify-end" : "justify-start",
        className,
      )}
    >
      <ActionIconButton
        label="Copy"
        disabled={!canCopy}
        onClick={() => void copyChatText(copyText)}
      >
        <Copy aria-hidden className="size-3.5" />
      </ActionIconButton>
      {showEdit && onEdit ? (
        <ActionIconButton label="Edit message" onClick={onEdit}>
          <Pencil aria-hidden className="size-3.5" />
        </ActionIconButton>
      ) : null}
    </div>
  );
}

function ActionIconButton({
  label,
  children,
  disabled,
  onClick,
}: {
  label: string;
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex size-7 items-center justify-center rounded-[var(--mv-radius-control)] text-muted-foreground transition-colors hover:bg-mv-panel hover:text-foreground",
        disabled && "pointer-events-none opacity-40",
      )}
    >
      {children}
    </button>
  );
}

type ChatMessageEditActionsProps = {
  onCancel: () => void;
  onSave: () => void;
  saveDisabled?: boolean;
};

export function ChatMessageEditActions({
  onCancel,
  onSave,
  saveDisabled,
}: ChatMessageEditActionsProps) {
  return (
    <div className="flex justify-end gap-1.5">
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex items-center gap-1 rounded-[var(--mv-radius-control)] px-2 py-1 text-[0.75rem] font-medium text-muted-foreground transition-colors hover:bg-mv-panel hover:text-foreground"
      >
        <X aria-hidden className="size-3.5" />
        Cancel
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={saveDisabled}
        className="inline-flex items-center gap-1 rounded-[var(--mv-radius-control)] bg-mv-panel px-2 py-1 text-[0.75rem] font-medium text-foreground transition-colors hover:bg-mv-panel/80 disabled:opacity-50"
      >
        <Check aria-hidden className="size-3.5" />
        Save &amp; resend
      </button>
    </div>
  );
}
