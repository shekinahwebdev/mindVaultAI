import { z } from "zod";

import { NoteType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { categorySelect, serializeCategory } from "@/lib/categories/serialize";
import { semanticSearchNotes } from "@/lib/notes/embedding-service";
import { truncateNoteContent } from "@/lib/notes/note-display";
import { noteSelect, serializeNote } from "@/lib/notes/serialize";

/**
 * Everything a read tool can return to the model. Model arguments are
 * validated with Zod before any of this runs — an invalid call never
 * reaches Prisma. Every query here is scoped to the userId passed in by
 * run-agent.ts, which gets it from the server session — there is no
 * parameter path that lets a tool call search or read another user's
 * data.
 */

const SEARCH_VAULT_TOP_K = 5;

const SearchVaultArgs = z.object({
  query: z.string().trim().min(1).max(500),
  mode: z.enum(["semantic", "keyword"]).optional(),
});

export type SearchVaultNote = {
  noteId: string;
  title: string;
  preview: string;
  type: string;
  categoryName: string | null;
  similarity?: number;
};

export async function executeSearchVault(
  userId: string,
  rawArgs: unknown,
): Promise<{ ok: true; notes: SearchVaultNote[] } | { ok: false; error: string }> {
  const parsed = SearchVaultArgs.safeParse(rawArgs);
  if (!parsed.success) {
    return { ok: false, error: "invalid_arguments" };
  }

  const { query, mode = "semantic" } = parsed.data;

  if (mode === "keyword") {
    const notes = await prisma.note.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { content: { contains: query, mode: "insensitive" } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: SEARCH_VAULT_TOP_K,
      select: noteSelect,
    });

    return {
      ok: true,
      notes: notes.map((note) => ({
        noteId: note.id,
        title: note.title,
        preview: truncateNoteContent(note.content),
        type: note.type,
        categoryName: note.category?.name ?? null,
      })),
    };
  }

  // Reuses the exact same pgvector cosine search as Semantic Search and
  // RAG — not a second retrieval implementation.
  const result = await semanticSearchNotes(userId, query, SEARCH_VAULT_TOP_K);
  if (!result.ok) {
    return { ok: false, error: "search_unavailable" };
  }

  return {
    ok: true,
    notes: result.matches.map((match) => ({
      noteId: match.note.id,
      title: match.note.title,
      preview: truncateNoteContent(match.note.content),
      type: match.note.type,
      categoryName: match.note.category?.name ?? null,
      similarity: match.similarity,
    })),
  };
}

const GetNoteArgs = z.object({
  noteId: z.string().trim().min(1).max(200),
});

export type GetNoteResult = {
  noteId: string;
  title: string;
  content: string;
  type: string;
  categoryName: string | null;
};

export async function executeGetNote(
  userId: string,
  rawArgs: unknown,
): Promise<{ ok: true; note: GetNoteResult } | { ok: false; error: string }> {
  const parsed = GetNoteArgs.safeParse(rawArgs);
  if (!parsed.success) {
    return { ok: false, error: "invalid_arguments" };
  }

  // Same ownership pattern as GET /api/notes/[id]: id + userId together,
  // so a note belonging to another user simply doesn't match and comes
  // back as not_found — never a permission error that would confirm the
  // id exists.
  const note = await prisma.note.findFirst({
    where: { id: parsed.data.noteId, userId },
    select: noteSelect,
  });

  if (!note) {
    return { ok: false, error: "not_found" };
  }

  const serialized = serializeNote(note);
  return {
    ok: true,
    note: {
      noteId: serialized.id,
      title: serialized.title,
      content: serialized.content,
      type: serialized.type,
      categoryName: serialized.category?.name ?? null,
    },
  };
}

export async function executeListCategories(
  userId: string,
): Promise<{ ok: true; categories: Array<{ id: string; name: string; noteCount: number }> }> {
  const categories = await prisma.category.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    select: categorySelect,
  });

  return {
    ok: true,
    categories: categories.map(serializeCategory).map((category) => ({
      id: category.id,
      name: category.name,
      noteCount: category.noteCount,
    })),
  };
}

const NOTE_TYPE_VALUES = Object.values(NoteType) as [NoteType, ...NoteType[]];

const CreateNoteArgs = z.object({
  title: z.string().trim().min(1).max(500),
  content: z.string().min(1).max(100_000),
  type: z.enum(NOTE_TYPE_VALUES).optional(),
  categoryName: z.string().trim().min(1).max(200).optional(),
  sourceUrl: z.string().trim().max(2048).optional(),
});

export type ProposedNote = {
  title: string;
  content: string;
  type: keyof typeof NoteType;
  sourceUrl: string | null;
  categoryId: string | null;
  categoryName: string | null;
};

/**
 * Validates and shapes a create_note proposal — it does NOT write to the
 * database. See run-agent.ts: a create_note call always ends the loop
 * and returns a pending action instead of being "executed" like the read
 * tools above. The actual write, if the user approves, goes through the
 * ordinary POST /api/notes route — this function exists only to turn
 * the model's raw (untrusted) arguments into something safe to show the
 * user as a proposal.
 */
export async function proposeCreateNote(
  userId: string,
  rawArgs: unknown,
): Promise<{ ok: true; proposal: ProposedNote } | { ok: false; error: string }> {
  const parsed = CreateNoteArgs.safeParse(rawArgs);
  if (!parsed.success) {
    return { ok: false, error: "invalid_arguments" };
  }

  const { title, content, type, categoryName, sourceUrl } = parsed.data;

  let categoryId: string | null = null;
  let resolvedCategoryName: string | null = null;
  if (categoryName) {
    // Same case-insensitive exact-match rule as Analyze's category
    // matching — never invents a category that doesn't already exist.
    const match = await prisma.category.findFirst({
      where: { userId, name: { equals: categoryName, mode: "insensitive" } },
      select: { id: true, name: true },
    });
    if (match) {
      categoryId = match.id;
      resolvedCategoryName = match.name;
    }
  }

  let validSourceUrl: string | null = null;
  if (sourceUrl) {
    try {
      const url = new URL(sourceUrl);
      if (url.protocol === "http:" || url.protocol === "https:") {
        validSourceUrl = sourceUrl;
      }
    } catch {
      // invalid URL from the model — silently dropped, not fatal to the proposal
    }
  }

  return {
    ok: true,
    proposal: {
      title,
      content,
      type: type ?? NoteType.NOTE,
      sourceUrl: validSourceUrl,
      categoryId,
      categoryName: resolvedCategoryName,
    },
  };
}
