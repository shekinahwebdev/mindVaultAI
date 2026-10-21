"use client";

import { useEffect, useState } from "react";

import { VaultDialog } from "@/components/vault/VaultDialog";
import {
  addCollectionItemRequest,
  fetchCollections,
} from "@/lib/collections/collections-client";
import type { SerializedCollection } from "@/lib/collections/collection-serialize";
import type { SerializedLibraryItem } from "@/lib/library/library-types";
import { toastError, toastSuccess } from "@/lib/vault-toast";

import { vaultSecondaryButton } from "../vault-controls";

type LibraryAddToCollectionDialogProps = {
  open: boolean;
  item: SerializedLibraryItem | null;
  onClose: () => void;
};

export function LibraryAddToCollectionDialog({
  open,
  item,
  onClose,
}: LibraryAddToCollectionDialogProps) {
  const [collections, setCollections] = useState<SerializedCollection[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    void (async () => {
      setLoading(true);
      const { data } = await fetchCollections();
      setLoading(false);
      if (data?.ok) {
        setCollections(data.collections);
      } else {
        toastError("Could not load collections.");
      }
    })();
  }, [open]);

  async function handleAdd(collectionId: string) {
    if (!item || addingId) return;
    setAddingId(collectionId);
    const { data } = await addCollectionItemRequest(collectionId, item.kind, item.id);
    setAddingId(null);
    if (!data?.ok) {
      toastError(data?.message ?? "Could not add to collection.");
      return;
    }
    toastSuccess("Added to collection.");
    onClose();
  }

  return (
    <VaultDialog
      open={open}
      onClose={onClose}
      title="Add to collection"
      description={item ? `Choose a collection for “${item.title}”.` : undefined}
    >
      {loading ? (
        <p className="text-[0.875rem] text-muted-foreground">Loading collections…</p>
      ) : collections.length === 0 ? (
        <p className="text-[0.875rem] text-muted-foreground">
          Create a collection from the Collections tab first.
        </p>
      ) : (
        <ul className="max-h-64 space-y-1 overflow-y-auto">
          {collections.map((collection) => (
            <li key={collection.id}>
              <button
                type="button"
                disabled={addingId === collection.id}
                onClick={() => void handleAdd(collection.id)}
                className="flex w-full items-center justify-between rounded-[var(--mv-radius-control)] px-3 py-2 text-left text-[0.875rem] hover:bg-mv-panel"
              >
                <span className="truncate font-medium text-foreground">{collection.name}</span>
                <span className="shrink-0 text-[0.75rem] text-mv-faint">
                  {addingId === collection.id ? "Adding…" : `${collection.itemCount} items`}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-5 flex justify-end">
        <button type="button" className={vaultSecondaryButton} onClick={onClose}>
          Close
        </button>
      </div>
    </VaultDialog>
  );
}
