import type { SerializedDocument } from "@/lib/documents/documents-client";

export type ChatAttachmentDoc = Pick<
  SerializedDocument,
  "id" | "title" | "originalFilename" | "processingDisplayStatus" | "processingLabel" | "status"
>;

export function attachmentChipLabel(doc: ChatAttachmentDoc): string {
  return doc.originalFilename || doc.title;
}

export function isAttachmentReady(doc: ChatAttachmentDoc): boolean {
  return doc.processingDisplayStatus === "ready";
}

export function mergeAttachmentDocs(
  attachedIds: string[],
  catalog: SerializedDocument[],
): ChatAttachmentDoc[] {
  const byId = new Map(catalog.map((doc) => [doc.id, doc]));
  return attachedIds
    .map((id) => byId.get(id))
    .filter((doc): doc is SerializedDocument => Boolean(doc))
    .map((doc) => ({
      id: doc.id,
      title: doc.title,
      originalFilename: doc.originalFilename,
      processingDisplayStatus: doc.processingDisplayStatus,
      processingLabel: doc.processingLabel,
      status: doc.status,
    }));
}
