import { NextResponse } from "next/server";

import { isUnauthorizedResponse, requireApiSession } from "@/lib/auth/guards";
import { parseInitiateUploadBody } from "@/lib/documents/document-validation";
import { DOCUMENT_SERVER_ERROR } from "@/lib/documents/config";
import { initiateDocumentUpload } from "@/lib/documents/upload-lifecycle";

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

  const parsed = parseInitiateUploadBody(body);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, message: parsed.message }, { status: 400 });
  }

  const result = await initiateDocumentUpload(auth.session.userId, parsed);
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

export const DOCUMENT_INITIATE_SERVER_ERROR = DOCUMENT_SERVER_ERROR;
