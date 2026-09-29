import { NextResponse } from "next/server";

import {
  isUnauthorizedResponse,
  requireApiSession,
} from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import {
  CATEGORY_NOT_FOUND,
  NOTE_SERVER_ERROR,
  notesListOrderBy,
  parseCreateNoteBody,
  parseNotesListQuery,
} from "@/lib/note-validation";
import { categoryBelongsToUser } from "@/lib/notes/category-ownership";
import { findTagForUser } from "@/lib/tags/tag-repository";
import { generateAndStoreNoteEmbedding } from "@/lib/notes/embedding-service";
import { NOTE_TAG_NOT_FOUND } from "@/lib/notes/note-tag-validation";
import { createNoteWithTags } from "@/lib/notes/note-tags-repository";
import { tagIdsBelongToUser } from "@/lib/notes/tag-ownership";
import { buildNotesListWhere } from "@/lib/notes/list-query";
import { noteSelect, serializeNote } from "@/lib/notes/serialize";

export async function GET(request: Request) {
  const auth = await requireApiSession();
  if (isUnauthorizedResponse(auth)) {
    return auth;
  }

  const { session } = auth;
  const { searchParams } = new URL(request.url);
  const query = parseNotesListQuery(searchParams);

  if (query.categoryId) {
    const owned = await categoryBelongsToUser(
      query.categoryId,
      session.userId,
    );
    if (!owned) {
      return NextResponse.json({
        ok: true,
        notes: [],
        pagination: {
          page: query.page,
          limit: query.limit,
          total: 0,
          totalPages: 0,
        },
      });
    }
  }

  if (query.tagId) {
    const tag = await findTagForUser(session.userId, query.tagId);
    if (!tag) {
      return NextResponse.json({
        ok: true,
        notes: [],
        pagination: {
          page: query.page,
          limit: query.limit,
          total: 0,
          totalPages: 0,
        },
      });
    }
  }

  try {
    const where = buildNotesListWhere(session.userId, query);

    const [notes, total] = await Promise.all([
      prisma.note.findMany({
        where,
        orderBy: notesListOrderBy(query.sort),
        skip: query.skip,
        take: query.limit,
        select: noteSelect,
      }),
      prisma.note.count({ where }),
    ]);

    return NextResponse.json({
      ok: true,
      notes: notes.map(serializeNote),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
      },
    });
  } catch (error) {
    console.error("List notes failed:", error);
    return NextResponse.json(
      { ok: false, message: NOTE_SERVER_ERROR },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireApiSession();
  if (isUnauthorizedResponse(auth)) {
    return auth;
  }

  const { session } = auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Invalid request." },
      { status: 400 },
    );
  }

  const parsed = parseCreateNoteBody(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: parsed.errors },
      { status: 400 },
    );
  }

  const { title, content, type, sourceUrl, categoryId, tagIds } = parsed.data;

  if (categoryId) {
    const owned = await categoryBelongsToUser(categoryId, session.userId);
    if (!owned) {
      return NextResponse.json(
        { ok: false, errors: { categoryId: CATEGORY_NOT_FOUND } },
        { status: 400 },
      );
    }
  }

  if (tagIds.length > 0) {
    const tagsOwned = await tagIdsBelongToUser(tagIds, session.userId);
    if (!tagsOwned) {
      return NextResponse.json(
        { ok: false, errors: { tagIds: NOTE_TAG_NOT_FOUND } },
        { status: 400 },
      );
    }
  }

  try {
    const note = await createNoteWithTags(
      session.userId,
      {
        title,
        content,
        type,
        sourceUrl,
        categoryId,
      },
      tagIds,
    );

    // Best-effort and isolated from the response: the note is already
    // saved above, so an embedding-provider outage must never turn a
    // successful save into a failed request. See embedding-service.ts.
    try {
      await generateAndStoreNoteEmbedding(note);
    } catch (error) {
      console.error("[ai:embed-note] unexpected error:", error);
    }

    return NextResponse.json(
      { ok: true, note: serializeNote(note) },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create note failed:", error);
    return NextResponse.json(
      { ok: false, message: NOTE_SERVER_ERROR },
      { status: 500 },
    );
  }
}
