"use client";

import { useState } from "react";

import { VaultDialog } from "@/components/vault/VaultDialog";
import { TagMultiSelect } from "@/components/vault/tags/TagMultiSelect";
import { updateDocumentTagsRequest } from "@/lib/collections/collections-client";
import { readAuthJson } from "@/lib/auth/client";
import type { SerializedLibraryItem } from "@/lib/library/library-types";
import { toastError, toastSuccess } from "@/lib/vault-toast";

import { vaultPrimaryButton, vaultSecondaryButton } from "../vault-controls";

type LibraryManageTagsDialogProps = {
  open: boolean;
  item: SerializedLibraryItem | null;
  onClose: () => void;
  onSaved: () => void;
};

function ManageTagsForm({
  item,
  onClose,
  onSaved,
}: {
  item: SerializedLibraryItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [tagIds, setTagIds] = useState(() => item.tags.map((tag) => tag.id));
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    if (busy) return;
    setBusy(true);

    if (item.kind === "note") {
      const response = await fetch(`/api/notes/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagIds }),
      });
      const data = await readAuthJson<{
        ok: boolean;
        message?: string;
        errors?: { tagIds?: string };
      }>(response);
      setBusy(false);
      if (!data?.ok) {
        toastError(data?.errors?.tagIds ?? data?.message ?? "Could not update tags.");
        return;
      }
    } else {
      const { data } = await updateDocumentTagsRequest(item.id, tagIds);
      setBusy(false);
      if (!data?.ok) {
        toastError(data?.message ?? "Could not update tags.");
        return;
      }
    }

    toastSuccess("Tags updated.");
    onClose();
    onSaved();
  }

  return (
    <>
      <TagMultiSelect value={tagIds} onChange={setTagIds} disabled={busy} />
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" className={vaultSecondaryButton} onClick={onClose}>
          Cancel
        </button>
        <button type="button" disabled={busy} className={vaultPrimaryButton} onClick={() => void handleSave()}>
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
    </>
  );
}

export function LibraryManageTagsDialog({
  open,
  item,
  onClose,
  onSaved,
}: LibraryManageTagsDialogProps) {
  return (
    <VaultDialog
      open={open}
      onClose={onClose}
      title="Manage tags"
      description={item ? `Tags for “${item.title}”.` : undefined}
    >
      {open && item ? (
        <ManageTagsForm
          key={`${item.kind}-${item.id}`}
          item={item}
          onClose={onClose}
          onSaved={onSaved}
        />
      ) : null}
    </VaultDialog>
  );
}
