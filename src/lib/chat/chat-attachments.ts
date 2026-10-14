import { DocumentStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";

export type ChatMessageAttachment = {
  documentId: string;
  title: string;
};

export type ChatAttachmentScope = {
  /** User selected one or more attachment ids (ready or still processing). */
  hasAttachments: boolean;
  /** READY document ids owned by the user — safe for chunk retrieval. */
  readyDocumentIds: string[];
  /** Requested ids that were dropped (wrong user, deleted, archived). */
  droppedDocumentIds: string[];
  /** Owned docs that are not READY yet (shown in UI, not searched). */
  notReadyDocumentIds: string[];
  /** Owned attachments in request order (for per-message chat UI). */
  attachedDocuments: ChatMessageAttachment[];
  includeNotes: boolean;
};

const MAX_ATTACHED_DOCUMENTS = 8;

export function normalizeAttachedDocumentIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const id = item.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
    if (ids.length >= MAX_ATTACHED_DOCUMENTS) break;
  }
  return ids;
}

/**
 * Validates attachment ids against the authenticated user.
 * Never trust client ids without this check.
 */
export async function resolveChatAttachmentScope(
  userId: string,
  requestedDocumentIds: string[],
  includeNotes: boolean,
): Promise<ChatAttachmentScope> {
  const uniqueRequested = normalizeAttachedDocumentIds(requestedDocumentIds);
  if (uniqueRequested.length === 0) {
    return {
      hasAttachments: false,
      readyDocumentIds: [],
      droppedDocumentIds: [],
      notReadyDocumentIds: [],
      attachedDocuments: [],
      includeNotes: true,
    };
  }

  const rows = await prisma.document.findMany({
    where: {
      id: { in: uniqueRequested },
      userId,
      archivedAt: null,
    },
    select: { id: true, status: true, title: true },
  });

  const found = new Map(rows.map((row) => [row.id, row]));
  const readyDocumentIds: string[] = [];
  const notReadyDocumentIds: string[] = [];
  const droppedDocumentIds: string[] = [];
  const attachedDocuments: ChatMessageAttachment[] = [];

  for (const id of uniqueRequested) {
    const row = found.get(id);
    if (!row) {
      droppedDocumentIds.push(id);
      continue;
    }
    attachedDocuments.push({ documentId: id, title: row.title });
    if (row.status === DocumentStatus.READY) {
      readyDocumentIds.push(id);
    } else {
      notReadyDocumentIds.push(id);
    }
  }

  return {
    hasAttachments: true,
    readyDocumentIds,
    droppedDocumentIds,
    notReadyDocumentIds,
    attachedDocuments,
    includeNotes,
  };
}
