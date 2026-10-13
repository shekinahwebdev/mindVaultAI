import type { ChatAttachmentScope } from "@/lib/chat/chat-attachments";

import type { RetrievalAvailability } from "./types";

export function buildAttachmentIndexingDisclaimer(
  scope: Pick<ChatAttachmentScope, "hasAttachments" | "notReadyDocumentIds"> | undefined,
): string | undefined {
  if (!scope?.hasAttachments || scope.notReadyDocumentIds.length === 0) {
    return undefined;
  }
  return "Some attached PDFs are still indexing; only READY attachments can be searched for excerpts.";
}

export function buildRetrievalDisclaimer(availability: RetrievalAvailability): string | undefined {
  const parts: string[] = [];
  if (availability.documentSearchUnavailable) {
    parts.push(
      "PDF document search was unavailable for this request; the answer may rely on notes only.",
    );
  }
  if (availability.noteSearchUnavailable) {
    parts.push(
      "Note search was unavailable for this request; the answer may rely on PDF excerpts only.",
    );
  }
  if (parts.length === 0) {
    return undefined;
  }
  return parts.join(" ");
}
