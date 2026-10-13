"use client";

import { Loader2, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { VaultDialog } from "@/components/vault/VaultDialog";
import type { SerializedDocument } from "@/lib/documents/documents-client";
import { cn } from "@/lib/utils";

import { vaultPrimaryButton, vaultSecondaryButton } from "../vault-controls";

type ChatDocumentPickerDialogProps = {
  open: boolean;
  documents: SerializedDocument[];
  loading: boolean;
  selectedIds: string[];
  onClose: () => void;
  onConfirm: (ids: string[]) => void;
};

export function ChatDocumentPickerDialog({
  open,
  documents,
  loading,
  selectedIds,
  onClose,
  onConfirm,
}: ChatDocumentPickerDialogProps) {
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<string[]>(selectedIds);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return documents;
    return documents.filter(
      (doc) =>
        doc.title.toLowerCase().includes(q) ||
        doc.originalFilename.toLowerCase().includes(q),
    );
  }, [documents, query]);

  function toggle(id: string) {
    setDraft((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  return (
    <VaultDialog
      open={open}
      title="Choose from Vault"
      description="Select PDFs to attach to this message. Only READY documents are searched for answers."
      onClose={onClose}
      className="max-w-lg"
    >
      <div className="space-y-3">
        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-mv-faint"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search documents…"
            className="h-10 w-full rounded-[var(--mv-radius-control)] border border-border bg-surface pl-9 pr-3 text-[0.875rem] outline-none"
          />
        </div>

        <div className="max-h-64 space-y-1 overflow-y-auto rounded-[var(--mv-radius-control)] border border-border p-1">
          {loading ? (
            <p className="flex items-center justify-center gap-2 py-8 text-[0.8125rem] text-muted-foreground">
              <Loader2 aria-hidden className="size-4 animate-spin" />
              Loading documents…
            </p>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-[0.8125rem] text-muted-foreground">
              No documents match your search.
            </p>
          ) : (
            filtered.map((doc) => {
              const checked = draft.includes(doc.id);
              const ready = doc.processingDisplayStatus === "ready";
              return (
                <label
                  key={doc.id}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-[var(--mv-radius-control)] px-2 py-2 hover:bg-mv-panel",
                    checked && "bg-mv-panel",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(doc.id)}
                    className="mt-1"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.875rem] font-medium text-foreground">
                      {doc.title}
                    </span>
                    <span className="block text-[0.75rem] text-muted-foreground">
                      {doc.processingLabel}
                      {!ready ? " · Indexing must finish before this PDF is searchable." : ""}
                    </span>
                  </span>
                </label>
              );
            })
          )}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className={vaultSecondaryButton}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(draft)}
            className={vaultPrimaryButton}
          >
            Add selected
          </button>
        </div>
      </div>
    </VaultDialog>
  );
}
