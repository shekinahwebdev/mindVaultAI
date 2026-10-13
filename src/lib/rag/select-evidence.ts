import type { DocumentChunkSearchRow } from "@/lib/documents/document-chunk-search";
import type { SemanticSearchMatch } from "@/lib/notes/embedding-service";

import type { RagDocumentSource, RagNoteSource, RagSource } from "./types";

export const RAG_NOTE_TOP_K = 5;
export const RAG_DOCUMENT_CHUNK_TOP_K = 5;
export const RAG_MIN_SIMILARITY = 0.6;
export const RAG_MAX_TOTAL_SOURCES = 8;
export const RAG_MAX_CHUNKS_PER_DOCUMENT = 3;

export function selectMixedEvidence(params: {
  noteMatches: SemanticSearchMatch[];
  documentMatches: DocumentChunkSearchRow[];
}): RagSource[] {
  const noteCandidates: RagNoteSource[] = params.noteMatches
    .filter((match) => match.similarity >= RAG_MIN_SIMILARITY)
    .map((match) => ({
      kind: "note",
      sourceNumber: 0,
      noteId: match.note.id,
      title: match.note.title,
      content: match.note.content,
      categoryName: match.note.category?.name ?? null,
      type: match.note.type,
      similarity: match.similarity,
    }));

  const docCandidates: RagDocumentSource[] = [];
  const perDocument = new Map<string, number>();

  for (const row of params.documentMatches) {
    if (row.similarity < RAG_MIN_SIMILARITY) {
      continue;
    }
    const count = perDocument.get(row.documentId) ?? 0;
    if (count >= RAG_MAX_CHUNKS_PER_DOCUMENT) {
      continue;
    }
    perDocument.set(row.documentId, count + 1);
    docCandidates.push({
      kind: "document",
      sourceNumber: 0,
      documentId: row.documentId,
      chunkId: row.chunkId,
      title: row.documentTitle,
      content: row.content,
      pageStart: row.pageStart,
      pageEnd: row.pageEnd,
      similarity: row.similarity,
    });
  }

  const merged = [...noteCandidates, ...docCandidates]
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, RAG_MAX_TOTAL_SOURCES);

  return merged.map((source, index) => ({
    ...source,
    sourceNumber: index + 1,
  }));
}
