import { NextResponse } from "next/server";

import { isUnauthorizedResponse, requireApiSession } from "@/lib/auth/guards";
import { handleIngestUrlRequest } from "@/lib/ingestion/url/ingest-handler";
import { INGEST_INVALID_REQUEST } from "@/lib/ingestion/url/ingest-validation";

export async function POST(request: Request) {
  const auth = await requireApiSession();
  if (isUnauthorizedResponse(auth)) {
    return auth;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: INGEST_INVALID_REQUEST },
      { status: 400 },
    );
  }

  const { session } = auth;
  const result = await handleIngestUrlRequest({ session, body });

  return NextResponse.json(result.body, { status: result.status });
}
