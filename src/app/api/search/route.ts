import { NextResponse } from "next/server";

import { isUnauthorizedResponse, requireApiSession } from "@/lib/auth/guards";
import { searchForUser } from "@/lib/search/search-repository";
import { parseSearchListQuery, validateSearchQuery } from "@/lib/search/search-validation";

const SEARCH_SERVER_ERROR = "Something went wrong while searching your vault.";
const SEARCH_INVALID_QUERY = "Enter a search phrase.";
const SEARCH_QUERY_TOO_SHORT = "Enter at least 2 characters for semantic search.";
const SEARCH_QUERY_TOO_LONG = "That search phrase is too long.";

export async function GET(request: Request) {
  const auth = await requireApiSession();
  if (isUnauthorizedResponse(auth)) {
    return auth;
  }

  const { session } = auth;
  const { searchParams } = new URL(request.url);
  const query = parseSearchListQuery(searchParams);
  const validation = validateSearchQuery(query);

  if (!validation.ok) {
    if (validation.reason === "empty") {
      return NextResponse.json({ ok: false, message: SEARCH_INVALID_QUERY }, { status: 400 });
    }
    if (validation.reason === "too_short") {
      return NextResponse.json({ ok: false, message: SEARCH_QUERY_TOO_SHORT }, { status: 400 });
    }
    return NextResponse.json({ ok: false, message: SEARCH_QUERY_TOO_LONG }, { status: 400 });
  }

  try {
    const outcome = await searchForUser(session.userId, query);
    if (!outcome.ok) {
      if (outcome.reason === "invalid_query") {
        return NextResponse.json({ ok: false, message: SEARCH_QUERY_TOO_SHORT }, { status: 400 });
      }
      if (outcome.reason === "timeout") {
        return NextResponse.json(
          { ok: false, message: "Search timed out. Try a shorter phrase or keyword search." },
          { status: 504 },
        );
      }
      return NextResponse.json(
        {
          ok: false,
          message:
            "Semantic search isn't available right now. You can still search your vault normally.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, search: outcome.result });
  } catch {
    return NextResponse.json({ ok: false, message: SEARCH_SERVER_ERROR }, { status: 500 });
  }
}
