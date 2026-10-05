import { NextResponse } from "next/server";

import {
  isUnauthorizedResponse,
  requireApiSession,
} from "@/lib/auth/guards";
import { categoryBelongsToUser } from "@/lib/notes/category-ownership";
import { parseArchiveListQuery } from "@/lib/notes/archive-validation";
import {
  emptyArchivedNotesForUser,
  getArchiveOverviewStats,
  listArchivedNotesForUser,
} from "@/lib/notes/archive-repository";
import { NOTE_SERVER_ERROR } from "@/lib/note-validation";

export async function GET(request: Request) {
  const auth = await requireApiSession();
  if (isUnauthorizedResponse(auth)) {
    return auth;
  }

  const { session } = auth;
  const { searchParams } = new URL(request.url);
  const query = parseArchiveListQuery(searchParams);

  if (query.categoryId) {
    const owned = await categoryBelongsToUser(
      query.categoryId,
      session.userId,
    );
    if (!owned) {
      return NextResponse.json({
        ok: true,
        notes: [],
        stats: {
          total: 0,
          noteCount: 0,
          codeCount: 0,
          linkCount: 0,
          articleCount: 0,
        },
      });
    }
  }

  try {
    const [notes, stats] = await Promise.all([
      listArchivedNotesForUser(session.userId, query),
      getArchiveOverviewStats(session.userId),
    ]);

    return NextResponse.json({ ok: true, notes, stats });
  } catch (error) {
    console.error("List archive failed:", error);
    return NextResponse.json(
      { ok: false, message: NOTE_SERVER_ERROR },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  const auth = await requireApiSession();
  if (isUnauthorizedResponse(auth)) {
    return auth;
  }

  const { session } = auth;

  try {
    const deletedCount = await emptyArchivedNotesForUser(session.userId);
    return NextResponse.json({ ok: true, deletedCount });
  } catch (error) {
    console.error("Empty archive failed:", error);
    return NextResponse.json(
      { ok: false, message: NOTE_SERVER_ERROR },
      { status: 500 },
    );
  }
}
