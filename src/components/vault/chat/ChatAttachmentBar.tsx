"use client";

import { Loader2, X } from "lucide-react";

import { cn } from "@/lib/utils";

import type { ChatAttachmentDoc } from "./chat-attachment-types";
import { attachmentChipLabel, isAttachmentReady } from "./chat-attachment-types";

type ChatAttachmentBarProps = {
  attachments: ChatAttachmentDoc[];
  includeNotes: boolean;
  onIncludeNotesChange: (value: boolean) => void;
  onRemove: (documentId: string) => void;
  uploadInProgress?: boolean;
  uploadLabel?: string;
};

export function ChatAttachmentBar({
  attachments,
  includeNotes,
  onIncludeNotesChange,
  onRemove,
  uploadInProgress,
  uploadLabel,
}: ChatAttachmentBarProps) {
  if (attachments.length === 0 && !uploadInProgress) {
    return null;
  }

  return (
    <div className="mb-2 space-y-2 px-1">
      <div className="flex flex-wrap gap-2">
        {uploadInProgress ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-[0.75rem] text-muted-foreground">
            <Loader2 aria-hidden className="size-3 animate-spin" />
            {uploadLabel ?? "Uploading PDF…"}
          </span>
        ) : null}
        {attachments.map((doc) => {
          const ready = isAttachmentReady(doc);
          return (
            <span
              key={doc.id}
              className={cn(
                "inline-flex max-w-full items-center gap-1 rounded-full border border-border bg-surface pl-2.5 pr-1 py-1 text-[0.75rem]",
                !ready && "border-dashed text-muted-foreground",
              )}
              title={ready ? doc.processingLabel : `${doc.processingLabel} — not searchable yet`}
            >
              <span className="truncate">{attachmentChipLabel(doc)}</span>
              {!ready ? (
                <span className="shrink-0 text-[0.6875rem] text-mv-faint">· {doc.processingLabel}</span>
              ) : null}
              <button
                type="button"
                onClick={() => onRemove(doc.id)}
                aria-label={`Remove ${attachmentChipLabel(doc)}`}
                className="ml-0.5 rounded-full p-0.5 text-mv-faint hover:bg-mv-panel hover:text-foreground"
              >
                <X aria-hidden className="size-3.5" />
              </button>
            </span>
          );
        })}
      </div>
      {attachments.length > 0 ? (
        <label className="flex items-center gap-2 text-[0.75rem] text-muted-foreground">
          <input
            type="checkbox"
            checked={includeNotes}
            onChange={(event) => onIncludeNotesChange(event.target.checked)}
            className="rounded border-border"
          />
          Also search my notes
        </label>
      ) : null}
    </div>
  );
}
