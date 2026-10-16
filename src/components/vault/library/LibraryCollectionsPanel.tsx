"use client";

import { FolderOpen, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { ContentCard } from "@/components/mv/ContentCard";
import { EmptyState } from "@/components/mv/EmptyState";
import {
  deleteCollectionRequest,
  fetchCollections,
  updateCollectionRequest,
} from "@/lib/collections/collections-client";
import type { SerializedCollection } from "@/lib/collections/collection-serialize";
import { toastError, toastSuccess } from "@/lib/vault-toast";

import { vaultSecondaryButton } from "../vault-controls";

import { CreateCollectionDialog } from "./CreateCollectionDialog";

type LibraryCollectionsPanelProps = {
  onOpenCollection: (collectionId: string, name: string) => void;
};

export function LibraryCollectionsPanel({ onOpenCollection }: LibraryCollectionsPanelProps) {
  const [collections, setCollections] = useState<SerializedCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const { data } = await fetchCollections();
      if (cancelled) return;
      setLoading(false);
      if (data?.ok) {
        setCollections(data.collections);
      } else {
        toastError("Could not load collections.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  async function handleRename(collection: SerializedCollection) {
    const next = window.prompt("Rename collection", collection.name);
    if (!next) return;
    const trimmed = next.trim();
    if (!trimmed || trimmed === collection.name) return;
    const { data } = await updateCollectionRequest(collection.id, { name: trimmed });
    if (!data?.ok) {
      toastError(data?.errors?.name ?? data?.message ?? "Could not rename collection.");
      return;
    }
    toastSuccess("Collection renamed.");
    setReloadToken((current) => current + 1);
  }

  async function handleDelete(collection: SerializedCollection) {
    if (!window.confirm(`Delete “${collection.name}”? Notes and PDFs stay in your vault.`)) {
      return;
    }
    const { data } = await deleteCollectionRequest(collection.id);
    if (!data?.ok) {
      toastError(data?.message ?? "Could not delete collection.");
      return;
    }
    toastSuccess("Collection deleted.");
    setReloadToken((current) => current + 1);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button type="button" className={vaultSecondaryButton} onClick={() => setCreateOpen(true)}>
          New collection
        </button>
      </div>

      {loading ? (
        <p className="text-[0.875rem] text-muted-foreground">Loading collections…</p>
      ) : collections.length === 0 ? (
        <EmptyState
          title="No collections yet"
          description="Create a collection to group related notes and PDFs."
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {collections.map((collection) => (
            <li key={collection.id}>
              <ContentCard padding="md" className="flex h-full flex-col gap-3">
                <button
                  type="button"
                  onClick={() => onOpenCollection(collection.id, collection.name)}
                  className="flex min-w-0 flex-1 items-start gap-3 text-left"
                >
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-[var(--mv-radius-control)] border border-border bg-mv-panel">
                    <FolderOpen aria-hidden className="size-4 text-muted-foreground" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[0.9375rem] font-medium text-foreground">
                      {collection.name}
                    </span>
                    <span className="mt-1 block text-[0.75rem] text-mv-faint">
                      {collection.itemCount} item{collection.itemCount === 1 ? "" : "s"}
                    </span>
                    {collection.description ? (
                      <span className="mt-2 line-clamp-2 block text-[0.8125rem] text-muted-foreground">
                        {collection.description}
                      </span>
                    ) : null}
                  </span>
                </button>
                <div className="flex justify-end gap-1">
                  <button
                    type="button"
                    aria-label={`Rename ${collection.name}`}
                    onClick={() => void handleRename(collection)}
                    className="inline-flex size-8 items-center justify-center rounded-[var(--mv-radius-control)] text-muted-foreground hover:bg-mv-panel hover:text-foreground"
                  >
                    <Pencil aria-hidden className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${collection.name}`}
                    onClick={() => void handleDelete(collection)}
                    className="inline-flex size-8 items-center justify-center rounded-[var(--mv-radius-control)] text-muted-foreground hover:bg-mv-panel hover:text-foreground"
                  >
                    <Trash2 aria-hidden className="size-4" />
                  </button>
                </div>
              </ContentCard>
            </li>
          ))}
        </ul>
      )}

      <CreateCollectionDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => setReloadToken((current) => current + 1)}
      />
    </div>
  );
}
