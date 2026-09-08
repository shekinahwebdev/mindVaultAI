import { NextResponse } from "next/server";

import {
  isUnauthorizedResponse,
  requireApiSession,
} from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import {
  CATEGORY_NOT_FOUND,
  NOTE_NOT_FOUND,
  NOTE_SERVER_ERROR,
  parseUpdateNoteBody,
} from "@/lib/note-validation";
import { categoryBelongsToUser } from "@/lib/notes/category-ownership";
import { noteSelect, serializeNote } from "@/lib/notes/serialize";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function noteNotFoundResponse() {
  return NextResponse.json(
    { ok: false, message: NOTE_NOT_FOUND },
    { status: 404 },
  );
}

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireApiSession();
  if (isUnauthorizedResponse(auth)) {
    return auth;
  }

  const { session } = auth;
  const { id } = await context.params;

  try {
    const note = await prisma.note.findFirst({
      where: {
        id,
        userId: session.userId,
      },
      select: noteSelect,
    });

    if (!note) {
      return noteNotFoundResponse();
    }

    return NextResponse.json({ ok: true, note: serializeNote(note) });
  } catch (error) {
    console.error("Get note failed:", error);
    return NextResponse.json(
      { ok: false, message: NOTE_SERVER_ERROR },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireApiSession();
  if (isUnauthorizedResponse(auth)) {
    return auth;
  }

  const { session } = auth;
  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Invalid request." },
      { status: 400 },
    );
  }

  const parsed = parseUpdateNoteBody(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: parsed.errors },
      { status: 400 },
    );
  }

  if (parsed.data.categoryId) {
    const owned = await categoryBelongsToUser(
      parsed.data.categoryId,
      session.userId,
    );
    if (!owned) {
      return NextResponse.json(
        { ok: false, errors: { categoryId: CATEGORY_NOT_FOUND } },
        { status: 400 },
      );
    }
  }

  try {
    const existing = await prisma.note.findFirst({
      where: {
        id,
        userId: session.userId,
      },
      select: { id: true },
    });

    if (!existing) {
      return noteNotFoundResponse();
    }

    const note = await prisma.note.update({
      where: { id: existing.id },
      data: parsed.data,
      select: noteSelect,
    });

    return NextResponse.json({ ok: true, note: serializeNote(note) });
  } catch (error) {
    console.error("Update note failed:", error);
    return NextResponse.json(
      { ok: false, message: NOTE_SERVER_ERROR },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireApiSession();
  if (isUnauthorizedResponse(auth)) {
    return auth;
  }

  const { session } = auth;
  const { id } = await context.params;

  try {
    const result = await prisma.note.deleteMany({
      where: {
        id,
        userId: session.userId,
      },
    });

    if (result.count === 0) {
      return noteNotFoundResponse();
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete note failed:", error);
    return NextResponse.json(
      { ok: false, message: NOTE_SERVER_ERROR },
      { status: 500 },
    );
  }
}
