import { NextResponse } from "next/server";

import { runDocumentUploadCleanup } from "@/lib/documents/cleanup";

/**
 * Callable cleanup for expired pending uploads and orphaned S3 objects.
 * Schedule externally (cron/worker). Protect with MINDVAULT_CLEANUP_SECRET.
 */
export async function POST(request: Request) {
  const secret = process.env.MINDVAULT_CLEANUP_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { ok: false, message: "Cleanup is not configured." },
      { status: 503 },
    );
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (token !== secret) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const result = await runDocumentUploadCleanup();
  return NextResponse.json({ ok: true, ...result });
}
