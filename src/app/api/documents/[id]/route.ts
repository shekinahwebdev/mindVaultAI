import { NextResponse } from "next/server";

import { isUnauthorizedResponse, requireApiSession } from "@/lib/auth/guards";
import { DOCUMENT_SERVER_ERROR } from "@/lib/documents/config";
import { getDocumentForUser } from "@/lib/documents/document-repository";
import { deleteDocumentForUser } from "@/lib/documents/upload-lifecycle";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireApiSession();
  if (isUnauthorizedResponse(auth)) {
    return auth;
  }

  const { id } = await context.params;
  try {
    const document = await getDocumentForUser(auth.session.userId, id);
    if (!document) {
      return NextResponse.json({ ok: false, message: "Document not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, document });
  } catch (error) {
    console.error("[documents:get]", error);
    return NextResponse.json({ ok: false, message: DOCUMENT_SERVER_ERROR }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireApiSession();
  if (isUnauthorizedResponse(auth)) {
    return auth;
  }

  const { id } = await context.params;
  const result = await deleteDocumentForUser(auth.session.userId, id);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, message: result.message, code: result.code, retryable: result.retryable },
      { status: result.status },
    );
  }

  return NextResponse.json({ ok: true });
}
