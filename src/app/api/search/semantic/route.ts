import { NextResponse } from "next/server";

import { isUnauthorizedResponse, requireApiSession } from "@/lib/auth/guards";
import { searchForUser, toLegacySemanticMatches } from "@/lib/search/search-repository";
import { parseSearchListQuery, validateSearchQuery } from "@/lib/search/search-validation";

export const SEMANTIC_SEARCH_SERVER_ERROR =
  "Semantic search isn't available right now. You can still search your vault normally.";
export const SEMANTIC_SEARCH_INVALID_QUERY = "Enter a search phrase to search by meaning.";

/** Legacy notes-only semantic endpoint — unified search lives at GET /api/search. */
export async function GET(request: Request) {
  const auth = await requireApiSession();
  if (isUnauthorizedResponse(auth)) {
    return auth;
  }

  const { session } = auth;
  const { searchParams } = new URL(request.url);
  const parsed = parseSearchListQuery(searchParams);
  const query = { ...parsed, mode: "semantic" as const, type: "note" as const, page: 1, limit: 8, skip: 0 };
  const validation = validateSearchQuery(query);

  if (!validation.ok) {
    return NextResponse.json(
      { ok: false, message: SEMANTIC_SEARCH_INVALID_QUERY },
      { status: 400 },
    );
  }

  const outcome = await searchForUser(session.userId, query);
  if (!outcome.ok) {
    return NextResponse.json(
      { ok: false, message: SEMANTIC_SEARCH_SERVER_ERROR },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, matches: toLegacySemanticMatches(outcome.result) });
}
