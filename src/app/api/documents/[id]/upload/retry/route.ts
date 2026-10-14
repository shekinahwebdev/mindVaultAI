import { NextResponse } from "next/server";

import { isUnauthorizedResponse, requireApiSession } from "@/lib/auth/guards";
import { retryDocumentUpload } from "@/lib/documents/upload-lifecycle";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const auth = await requireApiSession();
  if (isUnauthorizedResponse(auth)) {
    return auth;
  }

  const { id } = await context.params;
  const result = await retryDocumentUpload(auth.session.userId, id);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, message: result.message, code: result.code },
      { status: result.status },
    );
  }

  return NextResponse.json({
    ok: true,
    document: result.document,
    uploadUrl: result.uploadUrl,
    uploadExpiresAt: result.uploadExpiresAt,
    presignedExpiresInSeconds: result.presignedExpiresInSeconds,
  });
}
