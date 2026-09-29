import type { NoteType } from "@/generated/prisma/client";

export const noteSelect = {
  id: true,
  title: true,
  content: true,
  type: true,
  sourceUrl: true,
  categoryId: true,
  createdAt: true,
  updatedAt: true,
  category: {
    select: {
      id: true,
      name: true,
    },
  },
  noteTags: {
    select: {
      tag: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
} as const;

type NoteRecord = {
  id: string;
  title: string;
  content: string;
  type: NoteType;
  sourceUrl: string | null;
  categoryId: string | null;
  createdAt: Date;
  updatedAt: Date;
  category: {
    id: string;
    name: string;
  } | null;
  noteTags: Array<{
    tag: {
      id: string;
      name: string;
    };
  }>;
};

export type SerializedNoteTag = {
  id: string;
  name: string;
};

export type SerializedNote = {
  id: string;
  title: string;
  content: string;
  type: NoteType;
  sourceUrl: string | null;
  categoryId: string | null;
  category: {
    id: string;
    name: string;
  } | null;
  tags: SerializedNoteTag[];
  createdAt: string;
  updatedAt: string;
};

export function serializeNoteTags(
  noteTags: NoteRecord["noteTags"],
): SerializedNoteTag[] {
  return noteTags
    .map((row) => row.tag)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function serializeNote(note: NoteRecord): SerializedNote {
  return {
    id: note.id,
    title: note.title,
    content: note.content,
    type: note.type,
    sourceUrl: note.sourceUrl,
    categoryId: note.categoryId,
    category: note.category,
    tags: serializeNoteTags(note.noteTags),
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };
}
