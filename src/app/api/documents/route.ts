import { NextResponse } from "next/server";

import { isUnauthorizedResponse, requireApiSession } from "@/lib/auth/guards";
import { listDocumentsForUser } from "@/lib/documents/document-repository";
import { DOCUMENT_SERVER_ERROR } from "@/lib/documents/config";

export async function GET() {
  const auth = await requireApiSession();
  if (isUnauthorizedResponse(auth)) {
    return auth;
  }

  try {
    const documents = await listDocumentsForUser(auth.session.userId);
    return NextResponse.json({ ok: true, documents });
  } catch (error) {
    console.error("[documents:list]", error);
    return NextResponse.json({ ok: false, message: DOCUMENT_SERVER_ERROR }, { status: 500 });
  }
}
