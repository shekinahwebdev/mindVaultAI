import type { ChatAttachmentScope } from "@/lib/chat/chat-attachments";

import type { RetrievalAvailability } from "./types";

/** User-facing answer when document-scoped retrieval returns no evidence. */
export function buildAttachmentEmptyAnswer(scope: ChatAttachmentScope): string {
  if (
    scope.droppedDocumentIds.length > 0 &&
    scope.readyDocumentIds.length === 0 &&
    scope.notReadyDocumentIds.length === 0
  ) {
    return "The documents you attached are no longer available in your vault. Remove them or choose other PDFs.";
  }
  if (scope.readyDocumentIds.length === 0 && scope.notReadyDocumentIds.length > 0) {
    return "Your attached PDFs are still indexing. Wait until they show Ready, or remove the attachments to ask about the rest of your vault.";
  }
  if (scope.droppedDocumentIds.length > 0) {
    return "Some attached documents could not be found. I only searched the remaining attached PDFs and did not find a match for that question.";
  }
  return "I couldn't find relevant passages in your attached PDFs for that question.";
}

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
