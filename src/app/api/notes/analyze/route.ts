import { NextResponse } from "next/server";

import { analyzeNote } from "@/lib/ai/analyze-note";
import { isUnauthorizedResponse, requireApiSession } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import {
  ANALYZE_SERVER_ERROR,
  parseAnalyzeRequestBody,
  validateAnalysisSuggestion,
} from "@/lib/notes/analyze-validation";

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

  const parsed = parseAnalyzeRequestBody(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: parsed.message },
      { status: 400 },
    );
  }

  const categories = await prisma.category.findMany({
    where: { userId: session.userId },
    select: { id: true, name: true },
  });

  const result = await analyzeNote({
    content: parsed.content,
    categoryNames: categories.map((category) => category.name),
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

  const suggestion = validateAnalysisSuggestion(result.suggestion, categories);

  return NextResponse.json({ ok: true, suggestion }, { status: 200 });
}
