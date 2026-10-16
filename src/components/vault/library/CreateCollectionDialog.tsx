"use client";

import { useState } from "react";

import { VaultDialog } from "@/components/vault/VaultDialog";
import { createCollectionRequest } from "@/lib/collections/collections-client";
import { toastError, toastSuccess } from "@/lib/vault-toast";

import { vaultPrimaryButton, vaultSecondaryButton } from "../vault-controls";

type CreateCollectionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
};

export function CreateCollectionDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateCollectionDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    const { data } = await createCollectionRequest({
      name,
      description: description.trim() || undefined,
    });
    setBusy(false);

    if (!data?.ok) {
      toastError(data?.errors?.name ?? data?.message ?? "Could not create collection.");
      return;
    }

    toastSuccess("Collection created.");
    setName("");
    setDescription("");
    onOpenChange(false);
    onCreated();
  }

  return (
    <VaultDialog
      open={open}
      onClose={() => onOpenChange(false)}
      title="New collection"
      description="Group notes and PDFs without moving or deleting them."
    >
      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
        <label className="block space-y-1.5">
          <span className="text-[0.8125rem] font-medium text-foreground">Name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            maxLength={120}
            className="h-10 w-full rounded-[var(--mv-radius-control)] border border-border bg-surface px-3 text-[0.875rem] outline-none"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-[0.8125rem] font-medium text-foreground">Description (optional)</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            maxLength={2000}
            className="w-full resize-y rounded-[var(--mv-radius-control)] border border-border bg-surface px-3 py-2 text-[0.875rem] outline-none"
          />
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" className={vaultSecondaryButton} onClick={() => onOpenChange(false)}>
            Cancel
          </button>
          <button type="submit" disabled={busy || !name.trim()} className={vaultPrimaryButton}>
            {busy ? "Creating…" : "Create"}
          </button>
        </div>
      </form>
    </VaultDialog>
  );
}
