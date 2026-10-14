import { NextResponse } from "next/server";

import { isUnauthorizedResponse, requireApiSession } from "@/lib/auth/guards";
import { createDocumentDownloadUrl } from "@/lib/documents/document-repository";
import { DOCUMENT_SERVER_ERROR } from "@/lib/documents/config";
import { createDocumentS3Adapter } from "@/lib/storage/s3/client";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireApiSession();
  if (isUnauthorizedResponse(auth)) {
    return auth;
  }

  const { id } = await context.params;
  const s3 = createDocumentS3Adapter();

  try {
    const result = await createDocumentDownloadUrl(
      auth.session.userId,
      id,
      (storageKey, filename) =>
        s3.createPresignedDownloadUrl({
          storageKey,
          downloadFilename: filename,
          expiresInSeconds: 5 * 60,
        }),
    );

    if (!result.ok) {
      return NextResponse.json({ ok: false, message: result.message }, { status: result.status });
    }

    return NextResponse.json({
      ok: true,
      downloadUrl: result.downloadUrl,
      expiresInSeconds: result.expiresInSeconds,
    });
  } catch (error) {
    console.error("[documents:download]", error);
    return NextResponse.json({ ok: false, message: DOCUMENT_SERVER_ERROR }, { status: 500 });
  }
}
