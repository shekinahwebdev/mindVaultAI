import { DocumentStatus } from "@/generated/prisma/enums";
import { embedTextForRetrieval, getRetrievalProviderSpec } from "@/lib/ai/embed-text";
import { searchDocumentChunksBySimilarity } from "@/lib/documents/document-chunk-search";
import { prisma } from "@/lib/db";
import { searchNotesBySimilarity } from "@/lib/notes/embedding-repository";
import { truncateNoteContent } from "@/lib/notes/note-display";
import { noteSelect, serializeNote } from "@/lib/notes/serialize";
import { RAG_MIN_SIMILARITY } from "@/lib/rag/select-evidence";

import { searchDocumentsByKeyword } from "./search-document-keyword";
import {
  buildSearchNotesWhere,
  listFilteredDocumentIds,
  listFilteredNoteIds,
  searchFiltersAreValid,
} from "./search-scope";
import type { SearchFailureReason, SearchListResult, SerializedSearchResult } from "./search-types";
import type { SearchListQuery } from "./search-validation";

const KEYWORD_CANDIDATE_CAP = 200;
const SEMANTIC_NOTE_POOL = 24;
const SEMANTIC_CHUNK_POOL = 48;
const SEMANTIC_MAX_CHUNKS_PER_DOCUMENT = 3;
const SEARCH_DB_TIMEOUT_MS = 8_000;

type RankedCandidate = SerializedSearchResult & { rankScore: number };

export type SearchForUserOutcome =
  | { ok: true; result: SearchListResult }
  | { ok: false; reason: SearchFailureReason };

function emptyResult(query: SearchListQuery): SearchListResult {
  return {
    items: [],
    pagination: {
      page: query.page,
      limit: query.limit,
      total: 0,
      totalPages: 0,
      hasMore: false,
    },
    meta: { mode: query.mode },
  };
}

async function withSearchTimeout<T>(promise: Promise<T>): Promise<T> {
  let timeout: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error("search_timeout")), SEARCH_DB_TIMEOUT_MS);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeout!);
  }
}

function keywordNoteScore(title: string, content: string, q: string): number {
  const ql = q.toLowerCase();
  const tl = title.toLowerCase();
  if (tl === ql) return 100;
  if (tl.includes(ql)) return 80;
  if (content.toLowerCase().includes(ql)) return 50;
  return 0;
}

function keywordDocumentScore(row: {
  matchKind: "title" | "filename" | "body";
  title: string;
  originalFilename: string;
}, q: string): number {
  const ql = q.toLowerCase();
  const tl = row.title.toLowerCase();
  const fl = row.originalFilename.toLowerCase();
  if (tl === ql) return 100;
  if (tl.includes(ql)) return 80;
  if (fl.includes(ql)) return 70;
  if (row.matchKind === "body") return 55;
  return 40;
}

function paginateRanked(
  ranked: RankedCandidate[],
  query: SearchListQuery,
  semanticBounded: boolean,
): SearchListResult {
  const total = ranked.length;
  const pageItems = ranked.slice(query.skip, query.skip + query.limit);
  const hasMore =
    query.skip + pageItems.length < total ||
    (semanticBounded && pageItems.length >= query.limit);

  return {
    items: pageItems.map((item) => {
      const { rankScore: _ignored, ...rest } = item;
      void _ignored;
      return rest;
    }),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
      hasMore,
    },
    meta: {
      mode: query.mode,
      ...(semanticBounded ? { semanticDiscoveryBounded: true } : {}),
    },
  };
}

function excerptAroundMatch(text: string, q: string, maxLen = 220): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  const lower = trimmed.toLowerCase();
  const idx = lower.indexOf(q.toLowerCase());
  if (idx < 0) {
    return truncateNoteContent(trimmed).slice(0, maxLen);
  }
  const start = Math.max(0, idx - 60);
  const end = Math.min(trimmed.length, idx + q.length + 120);
  const slice = trimmed.slice(start, end).replace(/\s+/g, " ");
  return `${start > 0 ? "…" : ""}${slice}${end < trimmed.length ? "…" : ""}`;
}

async function resolveSemanticScopeIds(
  userId: string,
  query: SearchListQuery,
): Promise<{ noteIds: string[] | null; documentIds: string[] | null; restrictNotes: boolean; restrictDocs: boolean }> {
  const hasOrgFilter = Boolean(query.tagId || query.collectionId);
  if (!hasOrgFilter) {
    return {
      noteIds: null,
      documentIds: null,
      restrictNotes: false,
      restrictDocs: false,
    };
  }

  const [noteIds, documentIds] = await Promise.all([
    query.type === "document"
      ? Promise.resolve([])
      : listFilteredNoteIds(userId, { tagId: query.tagId, collectionId: query.collectionId }),
    query.type === "note"
      ? Promise.resolve([])
      : listFilteredDocumentIds(userId, { tagId: query.tagId, collectionId: query.collectionId }),
  ]);

  return {
    noteIds,
    documentIds,
    restrictNotes: hasOrgFilter,
    restrictDocs: hasOrgFilter,
  };
}

async function keywordSearchForUser(
  userId: string,
  query: SearchListQuery,
): Promise<SearchListResult> {
  const candidates: RankedCandidate[] = [];
  const q = query.q;

  if (query.type !== "document") {
    const notes = await prisma.note.findMany({
      where: buildSearchNotesWhere(userId, query),
      select: noteSelect,
      orderBy: { updatedAt: "desc" },
      take: KEYWORD_CANDIDATE_CAP,
    });

    for (const note of notes) {
      const serialized = serializeNote(note);
      const score = keywordNoteScore(serialized.title, serialized.content, q);
      if (score <= 0) continue;
      candidates.push({
        kind: "note",
        id: serialized.id,
        title: serialized.title,
        excerpt: excerptAroundMatch(serialized.content, q),
        updatedAt: serialized.updatedAt,
        noteType: serialized.type,
        tags: serialized.tags,
        pageStart: null,
        pageEnd: null,
        similarity: null,
        rankScore: score,
      });
    }
  }

  if (query.type !== "note") {
    const scope = await resolveSemanticScopeIds(userId, query);
    const docScopeIds = scope.restrictDocs
      ? scope.documentIds ?? []
      : null;

    const docRows = await searchDocumentsByKeyword(userId, q, docScopeIds);
    for (const row of docRows) {
      const score = keywordDocumentScore(row, q);
      const excerpt =
        row.matchKind === "body" && row.chunkContent
          ? excerptAroundMatch(row.chunkContent, q)
          : row.title;

      candidates.push({
        kind: "document",
        id: row.documentId,
        title: row.title,
        excerpt,
        updatedAt: row.updatedAt.toISOString(),
        noteType: null,
        tags: [],
        pageStart: row.pageStart,
        pageEnd: row.pageEnd,
        similarity: null,
        rankScore: score,
      });
    }
  }

  candidates.sort((a, b) => {
    if (b.rankScore !== a.rankScore) return b.rankScore - a.rankScore;
    if (a.kind !== b.kind) return a.kind.localeCompare(b.kind);
    return b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id);
  });

  return paginateRanked(candidates, query, false);
}

async function semanticSearchForUser(
  userId: string,
  query: SearchListQuery,
): Promise<SearchForUserOutcome> {
  const retrievalSpec = getRetrievalProviderSpec();
  const embedded = await embedTextForRetrieval({ text: query.q, taskType: "query" });
  if (!embedded.ok) {
    return { ok: false, reason: embedded.reason };
  }

  const scope = await resolveSemanticScopeIds(userId, query);
  const noteSearch =
    query.type !== "document"
      ? withSearchTimeout(
          searchNotesBySimilarity(userId, embedded.embedding, SEMANTIC_NOTE_POOL, {
            noteIds: scope.noteIds ?? undefined,
            restrictToNoteIds: scope.restrictNotes,
            retrievalProvider: retrievalSpec.provider,
          }),
        )
      : Promise.resolve([]);

  const docSearch =
    query.type !== "note"
      ? withSearchTimeout(
          searchDocumentChunksBySimilarity(userId, embedded.embedding, SEMANTIC_CHUNK_POOL, {
            documentIds: scope.documentIds ?? undefined,
            restrictToDocumentIds: scope.restrictDocs,
            retrievalProvider: retrievalSpec.provider,
          }),
        )
      : Promise.resolve([]);

  let noteRows: Awaited<ReturnType<typeof searchNotesBySimilarity>> = [];
  let documentRows: Awaited<ReturnType<typeof searchDocumentChunksBySimilarity>> = [];

  try {
    [noteRows, documentRows] = await Promise.all([noteSearch, docSearch]);
  } catch (error) {
    if ((error as Error).message === "search_timeout") {
      return { ok: false, reason: "timeout" };
    }
    return { ok: false, reason: "provider_error" };
  }

  const candidates: RankedCandidate[] = [];

  if (query.type !== "document") {
    const noteIds = noteRows.map((row) => row.id);
    const hydrated =
      noteIds.length > 0
        ? await prisma.note.findMany({
            where: { id: { in: noteIds }, userId, archivedAt: null },
            select: noteSelect,
          })
        : [];
    const notesById = new Map(hydrated.map((note) => [note.id, serializeNote(note)]));

    for (const row of noteRows) {
      if (row.similarity < RAG_MIN_SIMILARITY) continue;
      const note = notesById.get(row.id);
      if (!note) continue;
      candidates.push({
        kind: "note",
        id: note.id,
        title: note.title,
        excerpt: truncateNoteContent(note.content),
        updatedAt: note.updatedAt,
        noteType: note.type,
        tags: note.tags,
        pageStart: null,
        pageEnd: null,
        similarity: row.similarity,
        rankScore: row.similarity,
      });
    }
  }

  if (query.type !== "note") {
    const bestByDocument = new Map<
      string,
      {
        similarity: number;
        title: string;
        content: string;
        pageStart: number;
        pageEnd: number;
        updatedAt: string;
      }
    >();
    const chunkCounts = new Map<string, number>();

    for (const row of documentRows) {
      if (row.similarity < RAG_MIN_SIMILARITY) continue;
      const count = chunkCounts.get(row.documentId) ?? 0;
      if (count >= SEMANTIC_MAX_CHUNKS_PER_DOCUMENT) continue;

      const existing = bestByDocument.get(row.documentId);
      if (!existing || row.similarity > existing.similarity) {
        bestByDocument.set(row.documentId, {
          similarity: row.similarity,
          title: row.documentTitle,
          content: row.content,
          pageStart: row.pageStart,
          pageEnd: row.pageEnd,
          updatedAt: "",
        });
      }
      chunkCounts.set(row.documentId, count + 1);
    }

    const docIds = [...bestByDocument.keys()];
    const docs =
      docIds.length > 0
        ? await prisma.document.findMany({
            where: {
              id: { in: docIds },
              userId,
              archivedAt: null,
              status: DocumentStatus.READY,
            },
            select: {
              id: true,
              updatedAt: true,
              documentTags: { select: { tag: { select: { id: true, name: true } } } },
            },
          })
        : [];
    const docMeta = new Map(docs.map((d) => [d.id, d]));

    for (const [documentId, match] of bestByDocument) {
      const meta = docMeta.get(documentId);
      if (!meta) continue;
      candidates.push({
        kind: "document",
        id: documentId,
        title: match.title,
        excerpt: truncateNoteContent(match.content),
        updatedAt: meta.updatedAt.toISOString(),
        noteType: null,
        tags: meta.documentTags.map((row) => row.tag).sort((a, b) => a.name.localeCompare(b.name)),
        pageStart: match.pageStart,
        pageEnd: match.pageEnd,
        similarity: match.similarity,
        rankScore: match.similarity,
      });
    }
  }

  candidates.sort((a, b) => {
    if (b.rankScore !== a.rankScore) return b.rankScore - a.rankScore;
    return b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id);
  });

  const semanticBounded =
    noteRows.length >= SEMANTIC_NOTE_POOL || documentRows.length >= SEMANTIC_CHUNK_POOL;

  return {
    ok: true,
    result: paginateRanked(candidates, query, semanticBounded),
  };
}

export async function searchForUser(
  userId: string,
  query: SearchListQuery,
): Promise<SearchForUserOutcome> {
  const filtersValid = await searchFiltersAreValid(userId, query);
  if (!filtersValid) {
    return { ok: true, result: emptyResult(query) };
  }

  if (query.mode === "keyword") {
    return { ok: true, result: await keywordSearchForUser(userId, query) };
  }

  return semanticSearchForUser(userId, query);
}

/** Map unified results to legacy semantic API shape (notes only). */
export function toLegacySemanticMatches(result: SearchListResult) {
  return result.items
    .filter((item) => item.kind === "note" && item.similarity !== null)
    .map((item) => ({
      note: {
        id: item.id,
        title: item.title,
        content: item.excerpt,
        type: item.noteType ?? "NOTE",
        sourceUrl: null,
        categoryId: null,
        category: null,
        createdAt: item.updatedAt,
        updatedAt: item.updatedAt,
        archivedAt: null,
        tags: item.tags,
      },
      similarity: item.similarity as number,
    }));
}
