import { NextResponse } from "next/server";

import { isUnauthorizedResponse, requireApiSession } from "@/lib/auth/guards";
import { completeDocumentUpload } from "@/lib/documents/upload-lifecycle";

function parseDocumentId(body: unknown): string | null {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return null;
  }
  const id = (body as Record<string, unknown>).documentId;
  return typeof id === "string" && id.trim().length > 0 ? id.trim() : null;
}

export async function POST(request: Request) {
  const auth = await requireApiSession();
  if (isUnauthorizedResponse(auth)) {
    return auth;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }

  const documentId = parseDocumentId(body);
  if (!documentId) {
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }

  const result = await completeDocumentUpload(auth.session.userId, documentId);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, message: result.message, code: result.code },
      { status: result.status },
    );
  }

  return NextResponse.json({ ok: true, document: result.document });
}
