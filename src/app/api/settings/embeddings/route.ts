import { NextResponse } from "next/server";

import {
  isUnauthorizedResponse,
  requireApiSession,
} from "@/lib/auth/guards";
import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL } from "@/lib/ai/embed-text";
import { prisma } from "@/lib/db";
import { backfillEmbeddingsForUser } from "@/lib/notes/embedding-service";
import { findNoteIdsNeedingEmbedding } from "@/lib/notes/embedding-repository";
import { SETTINGS_SERVER_ERROR } from "@/lib/settings/settings-config";

export async function GET() {
  const auth = await requireApiSession();
  if (isUnauthorizedResponse(auth)) {
    return auth;
  }

  try {
    const [totalNotes, embeddedNotes, missingIds] = await Promise.all([
      prisma.note.count({ where: { userId: auth.session.userId } }),
      prisma.noteEmbedding.count({
        where: { note: { userId: auth.session.userId } },
      }),
      findNoteIdsNeedingEmbedding(
        auth.session.userId,
        EMBEDDING_MODEL,
        EMBEDDING_DIMENSIONS,
      ),
    ]);

    return NextResponse.json({
      ok: true,
      totalNotes,
      embeddedNotes,
      missingEmbeddings: missingIds.length,
    });
  } catch (error) {
    console.error("Embeddings status failed:", error);
    return NextResponse.json(
      { ok: false, message: SETTINGS_SERVER_ERROR },
      { status: 500 },
    );
  }
}

export async function POST() {
  const auth = await requireApiSession();
  if (isUnauthorizedResponse(auth)) {
    return auth;
  }

  try {
    const result = await backfillEmbeddingsForUser(auth.session.userId);

    return NextResponse.json({
      ok: true,
      total: result.total,
      succeeded: result.succeeded,
      failed: result.failed,
    });
  } catch (error) {
    console.error("Embeddings rebuild failed:", error);
    return NextResponse.json(
      { ok: false, message: SETTINGS_SERVER_ERROR },
      { status: 500 },
    );
  }
}
