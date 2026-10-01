import { NextResponse } from "next/server";

import { UsageEventType } from "@/generated/prisma/enums";
import { analyzeNote } from "@/lib/ai/analyze-note";
import {
  AI_LIMIT_REACHED_CODE,
  AI_LIMIT_REACHED_MESSAGE,
} from "@/lib/billing/messages";
import { getUserEntitlements } from "@/lib/billing/entitlements";
import { recordAiUsage } from "@/lib/billing/usage-metering";
import { isUnauthorizedResponse, requireApiSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import {
  ANALYZE_SERVER_ERROR,
  parseAnalyzeRequestBody,
  validateAnalysisSuggestion,
} from "@/lib/notes/analyze-validation";
import { tagIdsBelongToUser } from "@/lib/notes/tag-ownership";
import { getTagsForNoteAnalysis } from "@/lib/tags/tags-for-analysis";

export async function POST(request: Request) {
  const auth = await requireApiSession();
  if (isUnauthorizedResponse(auth)) {
    return auth;
  }

  const { session } = auth;

  const { getUserPreferenceFlags } = await import("@/lib/settings/preferences-server");
  const flags = await getUserPreferenceFlags(session.userId);
  if (!flags.aiAssistanceEnabled) {
    return NextResponse.json(
      { ok: false, message: "AI-assisted organization is disabled in Settings." },
      { status: 403 },
    );
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

  const parsed = parseAnalyzeRequestBody(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: parsed.message },
      { status: 400 },
    );
  }

  const [categories, userTags] = await Promise.all([
    prisma.category.findMany({
      where: { userId: session.userId },
      select: { id: true, name: true },
    }),
    getTagsForNoteAnalysis(session.userId),
  ]);

  if (parsed.selectedTagIds.length > 0) {
    const owned = await tagIdsBelongToUser(
      parsed.selectedTagIds,
      session.userId,
    );
    if (!owned) {
      return NextResponse.json(
        { ok: false, message: ANALYZE_SERVER_ERROR },
        { status: 400 },
      );
    }
  }

  const entitlements = await getUserEntitlements(session.userId);
  if (entitlements.aiRequests.remaining <= 0) {
    return NextResponse.json(
      {
        ok: false,
        error: AI_LIMIT_REACHED_CODE,
        message: AI_LIMIT_REACHED_MESSAGE,
      },
      { status: 429 },
    );
  }

  const result = await analyzeNote({
    content: parsed.content,
    categoryNames: categories.map((category) => category.name),
    tagNames: userTags.map((tag) => tag.name),
  });

  // Development logging for learning purposes: model behavior, not content.
  console.log("[ai:analyze-note]", {
    userId: session.userId,
    model: result.meta.model,
    ok: result.ok,
    latencyMs: result.meta.latencyMs,
    ...(result.ok
      ? {
          inputTokens: result.meta.inputTokens,
          outputTokens: result.meta.outputTokens,
        }
      : { reason: result.reason }),
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, message: ANALYZE_SERVER_ERROR },
      { status: 502 },
    );
  }

  await recordAiUsage(session.userId, UsageEventType.AI_ANALYZE);

  const suggestion = validateAnalysisSuggestion(
    result.suggestion,
    categories,
    userTags,
    parsed.selectedTagIds,
  );

  return NextResponse.json({ ok: true, suggestion }, { status: 200 });
}
