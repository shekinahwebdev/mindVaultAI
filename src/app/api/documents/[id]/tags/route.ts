import { NextResponse } from "next/server";

import { isUnauthorizedResponse, requireApiSession } from "@/lib/auth/guards";
import { replaceDocumentTagsForUser } from "@/lib/documents/document-tags-repository";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
  const auth = await requireApiSession();
  if (isUnauthorizedResponse(auth)) {
    return auth;
  }

  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON body." }, { status: 400 });
  }

  const record = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const result = await replaceDocumentTagsForUser(auth.session.userId, id, record.tagIds);

  if (!result.ok) {
    if (result.reason === "not_found") {
      return NextResponse.json({ ok: false, message: "Document not found." }, { status: 404 });
    }
    if (result.reason === "tag_not_found") {
      return NextResponse.json({ ok: false, message: "Tag not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: false, message: "Invalid tag list." }, { status: 400 });
  }

  return NextResponse.json({ ok: true, tagIds: result.tagIds });
}
