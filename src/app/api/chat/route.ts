import { NextResponse } from "next/server";

import { isUnauthorizedResponse, requireApiSession } from "@/lib/auth/guards";
import { askVault, RAG_UNAVAILABLE_MESSAGE } from "@/lib/rag/ask-vault";

export const CHAT_INVALID_QUESTION = "Ask a real question about your vault.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }

  if (!isRecord(body) || typeof body.question !== "string") {
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }

  // userId always comes from the server session above — askVault has no
  // parameter that would let a client ask on another user's behalf.
  const result = await askVault(session.userId, body.question);

  if (!result.ok) {
    if (result.reason === "invalid_question") {
      return NextResponse.json({ ok: false, message: CHAT_INVALID_QUESTION }, { status: 400 });
    }
    return NextResponse.json({ ok: false, message: RAG_UNAVAILABLE_MESSAGE }, { status: 502 });
  }

  return NextResponse.json({ ok: true, answer: result.answer, sources: result.sources });
}
