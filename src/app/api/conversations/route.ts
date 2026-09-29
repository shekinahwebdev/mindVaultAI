import { NextResponse } from "next/server";

import { isUnauthorizedResponse, requireApiSession } from "@/lib/auth/guards";
import { listConversationsForUser } from "@/lib/chat/chat-repository";

export async function GET() {
  const auth = await requireApiSession();
  if (isUnauthorizedResponse(auth)) {
    return auth;
  }

  const conversations = await listConversationsForUser(auth.session.userId);

  return NextResponse.json({ ok: true, conversations });
}
