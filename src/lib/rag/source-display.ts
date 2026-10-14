import { isAskVaultDocumentSource, type AskVaultDocumentSource, type AskVaultSource } from "./types";

export function formatDocumentPageLabel(pageStart: number, pageEnd: number): string {
  if (pageStart === pageEnd) {
    return `Page ${pageStart}`;
  }
  return `Pages ${pageStart}–${pageEnd}`;
}

export function formatAskVaultSourceLabel(source: AskVaultSource): string {
  if (source.kind === "document") {
    return `${source.title} — ${formatDocumentPageLabel(source.pageStart, source.pageEnd)}`;
  }
  return source.title;
}

export function askVaultSourceKey(source: AskVaultSource): string {
  if (source.kind === "document") {
    return `doc:${source.documentId}:${source.chunkId}`;
  }
  return `note:${source.noteId}`;
}

export type DocumentCitationRef = Pick<
  AskVaultDocumentSource,
  "chunkId" | "pageStart" | "pageEnd"
>;

export type GroupedDocumentSource = {
  type: "document";
  documentId: string;
  title: string;
  citations: DocumentCitationRef[];
};

export type GroupedNoteSource = {
  type: "note";
  source: Extract<AskVaultSource, { noteId: string }>;
};

export type GroupedDisplaySource = GroupedDocumentSource | GroupedNoteSource;

/** One row per note or PDF; multiple chunk citations merge under the same document. */
export function groupSourcesForDisplay(sources: AskVaultSource[]): GroupedDisplaySource[] {
  const documentGroups = new Map<string, GroupedDocumentSource>();

  for (const source of sources) {
    if (isAskVaultDocumentSource(source)) {
      const existing = documentGroups.get(source.documentId);
      if (existing) {
        existing.citations.push({
          chunkId: source.chunkId,
          pageStart: source.pageStart,
          pageEnd: source.pageEnd,
        });
        continue;
      }
      documentGroups.set(source.documentId, {
        type: "document",
        documentId: source.documentId,
        title: source.title,
        citations: [
          {
            chunkId: source.chunkId,
            pageStart: source.pageStart,
            pageEnd: source.pageEnd,
          },
        ],
      });
    }
  }

  for (const group of documentGroups.values()) {
    group.citations.sort(
      (a, b) => a.pageStart - b.pageStart || a.pageEnd - b.pageEnd || a.chunkId.localeCompare(b.chunkId),
    );
  }

  const emittedDocuments = new Set<string>();
  const grouped: GroupedDisplaySource[] = [];

  for (const source of sources) {
    if (isAskVaultDocumentSource(source)) {
      if (emittedDocuments.has(source.documentId)) {
        continue;
      }
      emittedDocuments.add(source.documentId);
      const docGroup = documentGroups.get(source.documentId);
      if (docGroup) {
        grouped.push(docGroup);
      }
      continue;
    }

    grouped.push({ type: "note", source });
  }

  return grouped;
}
