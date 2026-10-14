import type { NoteType } from "@/generated/prisma/client";

import type { SerializedNoteTag } from "@/lib/notes/serialize";

export type LibraryItemKind = "note" | "document";

export type SerializedLibraryItem = {
  kind: LibraryItemKind;
  id: string;
  title: string;
  preview: string | null;
  createdAt: string;
  updatedAt: string;
  tags: SerializedNoteTag[];
  noteType: NoteType | null;
  processingDisplayStatus: string | null;
  processingLabel: string | null;
};

export type LibraryListResult = {
  items: SerializedLibraryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
