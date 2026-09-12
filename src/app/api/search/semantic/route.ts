import { NextResponse } from "next/server";

import { isUnauthorizedResponse, requireApiSession } from "@/lib/auth/guards";
import {
  SEMANTIC_SEARCH_TOP_K_DEFAULT,
  semanticSearchNotes,
} from "@/lib/notes/embedding-service";

export const SEMANTIC_SEARCH_SERVER_ERROR =
  "Semantic search isn't available right now. You can still search your vault normally.";
export const SEMANTIC_SEARCH_INVALID_QUERY = "Enter a search phrase to search by meaning.";

export async function GET(request: Request) {
  const auth = await requireApiSession();
  if (isUnauthorizedResponse(auth)) {
    return auth;
  }

  const { session } = auth;
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  // userId always comes from the server session above — never accepted
  // from the client, so there is no way for a request to search another
  // user's notes by passing a different id.
  const result = await semanticSearchNotes(session.userId, q, SEMANTIC_SEARCH_TOP_K_DEFAULT);

  if (!result.ok) {
    if (result.reason === "invalid_query") {
      return NextResponse.json(
        { ok: false, message: SEMANTIC_SEARCH_INVALID_QUERY },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { ok: false, message: SEMANTIC_SEARCH_SERVER_ERROR },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, matches: result.matches });
}
