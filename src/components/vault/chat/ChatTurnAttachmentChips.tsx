import { FileText } from "lucide-react";

import type { UserMessageAttachment } from "@/lib/chat/chat-metadata";

type ChatTurnAttachmentChipsProps = {
  attachments: UserMessageAttachment[];
  className?: string;
};

export function ChatTurnAttachmentChips({ attachments, className }: ChatTurnAttachmentChipsProps) {
  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <ul className="flex flex-wrap justify-end gap-1.5">
        {attachments.map((doc) => (
          <li
            key={doc.documentId}
            className="inline-flex max-w-[min(16rem,70vw)] items-center gap-1.5 rounded-full border border-border bg-surface/80 px-2.5 py-1 text-[0.75rem] text-muted-foreground"
          >
            <FileText aria-hidden className="size-3 shrink-0 text-mv-faint" />
            <span className="truncate" title={doc.title}>
              {doc.title}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
