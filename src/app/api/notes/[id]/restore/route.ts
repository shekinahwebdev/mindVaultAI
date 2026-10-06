import { NextResponse } from "next/server";

import {
  isUnauthorizedResponse,
  requireApiSession,
} from "@/lib/auth/guards";
import { NOTE_NOT_FOUND, NOTE_SERVER_ERROR } from "@/lib/note-validation";
import { restoreNoteForUser } from "@/lib/notes/archive-repository";
import { serializeNote } from "@/lib/notes/serialize";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const auth = await requireApiSession();
  if (isUnauthorizedResponse(auth)) {
    return auth;
  }

  const { session } = auth;
  const { id } = await context.params;

  try {
    const note = await restoreNoteForUser(session.userId, id);
    if (!note) {
      return NextResponse.json(
        { ok: false, message: NOTE_NOT_FOUND },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, note: serializeNote(note) });
  } catch (error) {
    console.error("Restore note failed:", error);
    return NextResponse.json(
      { ok: false, message: NOTE_SERVER_ERROR },
      { status: 500 },
    );
  }
}
