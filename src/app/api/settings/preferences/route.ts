import { NextResponse } from "next/server";

import { NoteType, SearchMode } from "@/generated/prisma/client";
import {
  isUnauthorizedResponse,
  requireApiSession,
} from "@/lib/auth/guards";
import { categoryBelongsToUser } from "@/lib/notes/category-ownership";
import { CATEGORY_NOT_FOUND } from "@/lib/note-validation";
import { SETTINGS_SERVER_ERROR } from "@/lib/settings/settings-config";
import { updateUserPreferences } from "@/lib/settings/settings-queries";
import { parseUpdatePreferencesBody } from "@/lib/settings/settings-validation";

export async function PATCH(request: Request) {
  const auth = await requireApiSession();
  if (isUnauthorizedResponse(auth)) {
    return auth;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Invalid request." },
      { status: 400 },
    );
  }

  const parsed = parseUpdatePreferencesBody(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: parsed.errors },
      { status: 400 },
    );
  }

  if (parsed.data.defaultCategoryId) {
    const owned = await categoryBelongsToUser(
      parsed.data.defaultCategoryId,
      auth.session.userId,
    );
    if (!owned) {
      return NextResponse.json(
        { ok: false, errors: { defaultCategoryId: CATEGORY_NOT_FOUND } },
        { status: 400 },
      );
    }
  }

  try {
    const preferences = await updateUserPreferences(auth.session.userId, {
      ...(parsed.data.defaultNoteType
        ? { defaultNoteType: parsed.data.defaultNoteType as NoteType }
        : {}),
      ...(parsed.data.defaultCategoryId !== undefined
        ? { defaultCategoryId: parsed.data.defaultCategoryId }
        : {}),
      ...(parsed.data.defaultSearchMode
        ? { defaultSearchMode: parsed.data.defaultSearchMode as SearchMode }
        : {}),
      ...(parsed.data.aiAssistanceEnabled !== undefined
        ? { aiAssistanceEnabled: parsed.data.aiAssistanceEnabled }
        : {}),
      ...(parsed.data.ragEnabled !== undefined
        ? { ragEnabled: parsed.data.ragEnabled }
        : {}),
      ...(parsed.data.reducedMotion !== undefined
        ? { reducedMotion: parsed.data.reducedMotion }
        : {}),
    });

    return NextResponse.json({
      ok: true,
      preferences: {
        defaultNoteType: preferences.defaultNoteType,
        defaultCategoryId: preferences.defaultCategoryId,
        defaultSearchMode: preferences.defaultSearchMode,
        aiAssistanceEnabled: preferences.aiAssistanceEnabled,
        ragEnabled: preferences.ragEnabled,
        reducedMotion: preferences.reducedMotion,
      },
    });
  } catch (error) {
    console.error("Update preferences failed:", error);
    return NextResponse.json(
      { ok: false, message: SETTINGS_SERVER_ERROR },
      { status: 500 },
    );
  }
}
