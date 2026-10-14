import { NextResponse } from "next/server";

import { isUnauthorizedResponse, requireApiSession } from "@/lib/auth/guards";
import { listLibraryForUser } from "@/lib/library/library-repository";
import { parseLibraryListQuery } from "@/lib/library/library-validation";

const LIBRARY_SERVER_ERROR = "Something went wrong loading your library.";

export async function GET(request: Request) {
  const auth = await requireApiSession();
  if (isUnauthorizedResponse(auth)) {
    return auth;
  }

  const { session } = auth;
  const { searchParams } = new URL(request.url);
  const query = parseLibraryListQuery(searchParams);

  try {
    const library = await listLibraryForUser(session.userId, query);
    return NextResponse.json({ ok: true, library });
  } catch {
    return NextResponse.json(
      { ok: false, message: LIBRARY_SERVER_ERROR },
      { status: 500 },
    );
  }
}
