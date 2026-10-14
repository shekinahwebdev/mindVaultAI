import type { NoteType } from "@/generated/prisma/client";

import type { SerializedNoteTag } from "@/lib/notes/serialize";

export type SearchContentType = "all" | "note" | "document";

export type SearchMode = "keyword" | "semantic";

export type SerializedSearchResult = {
  kind: "note" | "document";
  id: string;
  title: string;
  excerpt: string;
  updatedAt: string;
  noteType: NoteType | null;
  tags: SerializedNoteTag[];
  pageStart: number | null;
  pageEnd: number | null;
  similarity: number | null;
};

export type SearchListResult = {
  items: SerializedSearchResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  meta: {
    mode: SearchMode;
    semanticDiscoveryBounded?: boolean;
  };
};

export type SearchFailureReason =
  | "invalid_query"
  | "provider_error"
  | "rate_limit"
  | "timeout"
  | "invalid_output";
